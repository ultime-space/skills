import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { detectPack } from '../src/cli.mjs'

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codecraft-detect-'))
}

function write(root, rel, text = '') {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
}

function detect(setup) {
  const root = tempRoot()
  try {
    setup(root)
    return detectPack(root)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

void test('detectPack: Nuxt 2 pages/ is an app', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x' }))
      write(root, 'pages/index.vue')
      write(root, 'nuxt.config.js')
    }),
    'app',
  )
})

void test('detectPack: Nuxt 3 app/ is an app', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x', dependencies: { nuxt: '^3.0.0' } }))
      write(root, 'app/app.vue')
    }),
    'app',
  )
})

void test('detectPack: workspace root with a nested app is an app', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x', private: true }))
      write(root, 'mp-app/package.json', JSON.stringify({ name: 'mp' }))
      write(root, 'mp-app/src/App.vue')
      write(root, 'mp-app/src/pages/home.ts')
    }),
    'app',
  )
})

void test('detectPack: uni-app manifest + pages is an app', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x' }))
      write(root, 'manifest.json', '{}')
      write(root, 'pages.json', '{}')
    }),
    'app',
  )
})

void test('detectPack: framework dependency is an app', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x', devDependencies: { '@tarojs/taro': '^4.0.0' } }))
    }),
    'app',
  )
})

void test('detectPack: Vue CLI app (vue.config.js) is an app', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x', dependencies: { vue: '^2.7.0' } }))
      write(root, 'vue.config.js')
      write(root, 'public/index.html')
      write(root, 'src/main.js')
      write(root, 'src/router/index.js')
    }),
    'app',
  )
})

void test('detectPack: Vite SPA with framework entry is an app', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x', dependencies: { vue: '^3.5.0' } }))
      write(root, 'index.html')
      write(root, 'src/main.ts')
    }),
    'app',
  )
})

void test('detectPack: demo entry without a framework dependency stays a library', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x' }))
      write(root, 'index.html')
      write(root, 'src/main.ts')
    }),
    'library',
  )
})

void test('detectPack: package with src/ is a library', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x' }))
      write(root, 'src/index.ts')
    }),
    'library',
  )
})

void test('detectPack: packages/ is a library', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x', private: true }))
      write(root, 'packages/core/package.json', JSON.stringify({ name: '@x/core' }))
    }),
    'library',
  )
})

void test('detectPack: plain package.json is a library', () => {
  assert.equal(
    detect((root) => {
      write(root, 'package.json', JSON.stringify({ name: 'x' }))
    }),
    'library',
  )
})
