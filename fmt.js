const readline = require('readline')
const fs = require('fs')

// 读取当前目录
fs.readdir('./', (error, files) => {
  // 遍历目录
  if (error === null) files.forEach(file => {
    fs.lstat(file, (error, stats) => {
      // 判断是否为特定目录
      if (error === null && stats.isDirectory() && file.match(/^[a-zA-Z]/) !== null) {
        // 根据命名规则读取文件
        const tsFlie = `${file}/${file}.user.ts`
        const jsFlie = `${file}/${file}.user.js`
        fs.lstat(tsFlie, (error, stats) => {
          if (error === null && stats.isFile()) {
            let ok = 0
            const header = []
            const script = []
            // 写入js
            const writeJS = () => {
              fs.writeFile(jsFlie, header.concat(script).join('\n'), error => {
                if (error === null) console.log(jsFlie, 'ok')
                else console.error(error)
              })
            }
            // 读取ts
            const tsRL = readline.createInterface({
              input: fs.createReadStream(tsFlie),
              crlfDelay: Infinity
            })
            tsRL.on('line', line => {
              header.push(line)
              if (line === '// ==/UserScript==') {
                tsRL.removeAllListeners()
                ok++
                if (ok === 2) writeJS()
              }
            })
            // 读取js
            const jsRL = readline.createInterface({
              input: fs.createReadStream(jsFlie),
              crlfDelay: Infinity
            })
            jsRL.on('line', line => {
              if (!line.startsWith('import')) script.push(line)
            })
            jsRL.on('close', () => {
              ok++
              if (ok === 2) writeJS()
            })
          }
        })
      }
    })
  })
})