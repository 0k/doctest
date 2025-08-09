import { beforeAll, describe, test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from 'node:child_process';

import.meta.glob("../README.org", { query: "?raw" })

const SRC = 'README.org';
const OUT = 'README.md';

const cwd = process.cwd()

function srcIsNewer(src: string, out: string) {
    try {
        const s = fs.statSync(src).mtimeMs;
        const o = fs.statSync(out).mtimeMs;
        return s > o + 1; // small guard for FS timestamp granularity
    } catch {
        return true; // if OUT missing, (re)generate
    }
}

if (srcIsNewer(SRC, OUT)) {
    execSync('./autogen.sh', { stdio: 'inherit' });
}

// ```js ... ``` or ```ts ... ``` blocks that contain // @doctest
const FENCE_RE = /```(js|ts)\s+([\s\S]*?)```/g;

function extractDoctests(src: string) {
    const out: { lang: "js" | "ts"; code: string; index: number }[] = [];
    let m; let i = 0;
    while ((m = FENCE_RE.exec(src))) {
        const lang = m[1] as "js" | "ts";
        const code = m[2].trim();
        if (code.includes("// @doctest")) out.push({ lang, code, index: ++i });
    }
    return out;
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as any;

async function runSnippet(code: string, label = "README_doctest") {
    const __dirname  = cwd
    const __filename = path.resolve(cwd, OUT)

    // label helps stack traces in Node
    const body = `"use strict";\n//# sourceURL=${label}\n${code}\n`;

    const fn = new AsyncFunction(
        "expect", "vi", "console", "require", "module", "__dirname", "__filename",
        body
    );

    const nodeRequire = (global as any).require ?? undefined; // ok if undefined in ESM
    return fn(expect, (global as any).vi, console, nodeRequire, module, __dirname, __filename);
}

describe("README doctests", () => {
    const md = fs.readFileSync(path.resolve(cwd, OUT), "utf8");
    const blocks = extractDoctests(md);
    for (const b of blocks) {
        test(`block #${b.index} (${b.lang})`, async () => {
            await runSnippet(b.code);
        });
    }
});
