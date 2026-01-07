import { readdir, stat, readFile, mkdir, writeFile, copyFile } from "fs/promises";
import { join, resolve, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// 自动定位当前项目的 docs/knowledge 目录
const KNOWLEDGE_ROOT = resolve(process.cwd(), "docs/knowledge");

// 技能模板目录
const TEMPLATES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "templates");

// 标准目录结构
const REQUIRED_DIRS = [
  "concepts",   // 概念
  "guides",     // 指南
  "decisions",  // 决策
  "external"    // 外部参考
];

async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// 1. Init
async function init() {
  console.log(`🧠 Initializing Knowledge Base at: ${KNOWLEDGE_ROOT}\n`);

  if (!(await exists(KNOWLEDGE_ROOT))) {
    await mkdir(KNOWLEDGE_ROOT, { recursive: true });
    console.log(`✅ Created: ${KNOWLEDGE_ROOT}`);
  }

  for (const dir of REQUIRED_DIRS) {
    const path = join(KNOWLEDGE_ROOT, dir);
    if (!(await exists(path))) {
      await mkdir(path, { recursive: true });
      console.log(`✅ Created: ${path}/`);
    }
  }
  
  // Create index if not exists
  const indexPath = join(KNOWLEDGE_ROOT, "index.md");
  if (!(await exists(indexPath))) {
      await writeFile(indexPath, "# Knowledge Base Index\n\nRun `scan` or `index` to populate this file.\n");
      console.log(`✅ Created: index.md`);
  }

  console.log("\n✨ Knowledge Base structure initialized!");
}

// 2. Scan (Simple static analysis + Ace Tool hint)
async function scan() {
  console.log("🔍 Scanning codebase for domain concepts...\n");
  
  const suggestions: string[] = [];
  const filesToCheck: string[] = [];
  
  // 简单的递归文件收集
  async function collectFiles(dir: string) {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'docs') continue;
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
              await collectFiles(fullPath);
          } else if (['.ts', '.js', '.py', '.java', '.go', '.rs'].includes(extname(entry.name))) {
              filesToCheck.push(fullPath);
          }
      }
  }
  
  await collectFiles(process.cwd());
  
  // 简单的启发式扫描：查找大写开头的类名/接口名
  const conceptCounts: Record<string, number> = {};
  
  for (const file of filesToCheck.slice(0, 50)) { // 限制扫描文件数以保证速度
      try {
          const content = await readFile(file, 'utf-8');
          // 匹配 class X, interface Y, type Z
          const matches = content.matchAll(/(?:class|interface|type|enum|struct)\s+([A-Z][a-zA-Z0-9]+)/g);
          for (const match of matches) {
              const concept = match[1];
              conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;
          }
      } catch (e) {}
  }
  
  // 排序并取前 20
  const sortedConcepts = Object.entries(conceptCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name]) => name);
      
  const reportPath = join(KNOWLEDGE_ROOT, "suggested_concepts.md");
  let reportContent = "# Suggested Concepts to Document\n\n";
  reportContent += "> Based on static analysis of code definitions (Classes, Interfaces, Types).\n\n";
  
  for (const concept of sortedConcepts) {
      // Check if already documented
      const existsInDocs = await exists(join(KNOWLEDGE_ROOT, "concepts", `${concept}.md`));
      const mark = existsInDocs ? "✅" : "⬜";
      reportContent += `- [${mark}] **${concept}**\n`;
  }
  
  reportContent += "\n\n## Next Steps\n";
  reportContent += "Run `bun ~/.pi/agent/skills/knowledge-base/lib.ts create concept <Name>` to document these.";
  
  await writeFile(reportPath, reportContent);
  console.log(`✅ Scan complete. Suggestions saved to: ${reportPath}`);
  console.log(reportContent);
}

// 3. Create
async function create(type: string, name: string, category?: string) {
    if (!['concept', 'guide', 'decision'].includes(type)) {
        console.error("❌ Invalid type. Use: concept, guide, or decision");
        process.exit(1);
    }

    if (!name) {
        console.error("❌ Please provide a name.");
        process.exit(1);
    }

    // Sanitize name for filename
    const filename = name.replace(/[^a-zA-Z0-9\-_]/g, '') + ".md";
    let subDir = type + "s"; // concept -> concepts
    let templateName = `${type}-template.md`;

    // Build target path with category support
    let targetDir = join(KNOWLEDGE_ROOT, subDir);
    if (category) {
        // Sanitize category path
        const sanitizedCategory = category.replace(/[^a-zA-Z0-9\-_/]/g, '');
        targetDir = join(targetDir, sanitizedCategory);
        if (!(await exists(targetDir))) {
            await mkdir(targetDir, { recursive: true });
            console.log(`✅ Created category directory: ${sanitizedCategory}/`);
        }
    }

    // Decision needs date prefix
    if (type === 'decision') {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const safeName = name.replace(/\s+/g, '-');
        const finalFilename = `${date}-${safeName}.md`;

        const targetPath = join(targetDir, finalFilename);
        if (await exists(targetPath)) {
            console.error(`❌ File exists: ${targetPath}`);
            process.exit(1);
        }

        // Prepare content (replace title)
        let content = await readFile(join(TEMPLATES_DIR, templateName), 'utf-8');
        content = content.replace(/\[Decision Title\]/, name);

        await writeFile(targetPath, content);
        console.log(`✅ Created: ${targetPath}`);
        return;
    }

    // Normal files
    const targetPath = join(targetDir, filename);
    if (await exists(targetPath)) {
        console.error(`❌ File exists: ${targetPath}`);
        process.exit(1);
    }

    // Prepare content (replace title)
    let content = await readFile(join(TEMPLATES_DIR, templateName), 'utf-8');
    content = content.replace(/\[Concept Name\]|\[Guide Title\]/, name);

    await writeFile(targetPath, content);
    console.log(`✅ Created: ${targetPath}`);
}

// 4. Index (Generate index.md)
async function generateIndex() {
    console.log("🔄 Generating Knowledge Index...");

    let content = "# Knowledge Base Index\n\n";
    content += "> Generated automatically. Do not edit manually.\n\n";

    for (const dir of REQUIRED_DIRS) {
        const dirPath = join(KNOWLEDGE_ROOT, dir);
        if (!(await exists(dirPath))) continue;

        content += `## ${dir.charAt(0).toUpperCase() + dir.slice(1)}\n`;

        // Recursively collect all markdown files
        const docs: { path: string; title: string; relativePath: string }[] = [];

        async function collectDocs(currentDir: string, relativePath: string) {
            const entries = await readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.startsWith('.')) continue;

                const fullPath = join(currentDir, entry.name);
                const relPath = join(relativePath, entry.name);

                if (entry.isDirectory()) {
                    await collectDocs(fullPath, relPath);
                } else if (entry.name.endsWith('.md')) {
                    const fileContent = await readFile(fullPath, 'utf-8');
                    const titleMatch = fileContent.match(/^# (.+)$/m);
                    const title = titleMatch ? titleMatch[1] : entry.name;
                    docs.push({ path: fullPath, title, relativePath: relPath });
                }
            }
        }

        await collectDocs(dirPath, '');

        if (docs.length === 0) {
            content += "*No documents yet.*\n\n";
            continue;
        }

        // Group by depth (flat files first, then subdirectories)
        const flatDocs = docs.filter(d => !d.relativePath.includes('/'));
        const nestedDocs = docs.filter(d => d.relativePath.includes('/'));

        // Flat files
        for (const doc of flatDocs) {
            content += `- [${doc.title}](./${dir}/${doc.relativePath})\n`;
        }

        // Nested files with hierarchy
        const groupedByCategory: Record<string, typeof docs> = {};
        for (const doc of nestedDocs) {
            const category = doc.relativePath.split('/')[0];
            if (!groupedByCategory[category]) groupedByCategory[category] = [];
            groupedByCategory[category].push(doc);
        }

        for (const [category, categoryDocs] of Object.entries(groupedByCategory)) {
            content += `\n### ${category}\n`;
            for (const doc of categoryDocs) {
                content += `- [${doc.title}](./${dir}/${doc.relativePath})\n`;
            }
        }

        content += "\n";
    }

    await writeFile(join(KNOWLEDGE_ROOT, "index.md"), content);
    console.log(`✅ Updated: ${join(KNOWLEDGE_ROOT, "index.md")}`);
}

// 5. Search
async function search(keyword: string) {
    if (!keyword) {
        console.error("❌ Please provide a keyword.");
        process.exit(1);
    }

    console.log(`🔍 Searching for "${keyword}" in Knowledge Base...\n`);

    async function searchDir(dir: string, basePath: string = "") {
        if (!(await exists(dir))) return;
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;

            const fullPath = join(dir, entry.name);
            const relativePath = basePath ? join(basePath, entry.name) : entry.name;

            if (entry.isDirectory()) {
                await searchDir(fullPath, relativePath);
            } else if (entry.name.endsWith('.md')) {
                const content = await readFile(fullPath, 'utf-8');

                if (content.toLowerCase().includes(keyword.toLowerCase())) {
                    console.log(`📄 ${relativePath}`);
                    // Print context
                    const lines = content.split('\n');
                    lines.forEach((line, i) => {
                        if (line.toLowerCase().includes(keyword.toLowerCase())) {
                            console.log(`   Line ${i+1}: ${line.trim().substring(0, 80)}...`);
                        }
                    });
                    console.log("");
                }
            }
        }
    }

    for (const dir of REQUIRED_DIRS) {
        await searchDir(join(KNOWLEDGE_ROOT, dir), dir);
    }
}

// Main Dispatcher
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'init':
        init();
        break;
    case 'scan':
        scan();
        break;
    case 'create':
        create(args[1], args[2], args[3]);
        break;
    case 'index':
        generateIndex();
        break;
    case 'search':
        search(args[1]);
        break;
    default:
        console.log(`
Knowledge Base Manager

Usage:
  init                          Initialize docs/knowledge structure
  scan                          Scan codebase for concepts
  create <type> <name> [cat]    Create new doc (type: concept, guide, decision)
                                Optional: category path (e.g., "auth/user")
  index                         Regenerate index.md
  search <keyword>              Search knowledge base

Examples:
  bun lib.ts init
  bun lib.ts create concept "UserAuthentication" auth/user
  bun lib.ts create guide "ErrorHandling" backend
  bun lib.ts create decision "WhyUsePostgres" database
  bun lib.ts index
  bun lib.ts search "auth"
        `);
}
