const pty = require('node-pty')
const fs = require('fs-extra')
const seven = require('node-7z')
const axios = require('axios')
const appDirectory = require('path').dirname(process.pkg ? process.execPath : (require.main ? require.main.filename : process.argv[0])).replace(/\\/g, '/')

module.exports = {
    installToPath: (path, callback) => {
        return new Promise(async function (resolve) {
			let chunks = 0
            const c = await axios({
                url: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip',
                method: 'GET',
                responseType: 'stream'
			})
			const length = c.headers['content-length']
            const writer = fs.createWriteStream(path)
			c.data.on('data', (chunk) => {
				chunks += chunk.length
				callback({
                    type: 'download',
                    percent: Math.ceil(chunks / length * 100),
					chunks: chunks
				})
            })
            c.data.pipe(writer)

            writer.on('finish', () => {
                seven.extractFull(path, `${appDirectory}/steam`, {
                        $bin: appDirectory + '/7za.exe',
                        $progress: true
                    }).on('progress', (dat) => {
                        callback({
                            type: 'unzip',
                            percent: Math.ceil(dat.percent),
                            files: dat.fileCount
                        })
                    })
                    .on('end', () => {
                        resolve({
                            path,
                            success: true
                        })

                    })
            })
            writer.on('error', () => {
                resolve(false)
            })

        })

    },
    download: (appID, cmds, callback) => {
        return new Promise(function (resolve) {
            //Splits args into steamcmd valid ones
            var args = cmds.concat('quit').map(function (x) {
                return '+' + x
            }).join(' ').replace('{{app_id}}', appID).split(' ')

            const c = pty.spawn(appDirectory + '/steam/steamcmd.exe', args, {
                cwd: appDirectory + '/steam/'
            })
            c.on('data', (dat) => {
                if (dat.includes('Update state')) {
                    dat = dat.match(/\(([^)]+)\)/g)
                    dat[0] = dat[0].replace(/[()]/g, '')
                    dat[1] = dat[1].replace(/[()" "]/g, '').split('/').map(x => parseFloat(x))
                    dat[1] = dat[1][0] / dat[1][1] * 100
                    if (isNaN(dat[1])) dat[1] = 0
                    var datObj = {
                        code: dat[0],
                        progress: dat[1]
                    }
                    callback(datObj)
                }
                if (dat.includes(`App '${appID}' fully installed`)) {
                    resolve()
                }
                //if (dat.indexOf('Success! App \'232330\' fully installed') !== -1) console.log(true)
            })
        })
    },
    extract: ((file, callback) => {
        return new Promise(function (resolve) {
            if (!fs.existsSync(appDirectory + '/cssource/bin/vpk.exe')) return resolve(false)
            const c = pty.spawn(appDirectory + '/cssource/bin/vpk.exe', [file])
            c.on('data', (dat) => {
                dat = dat.substr(dat.indexOf(" ") + 1)
                callback({
                    file: dat
                })
            })
            c.on('exit', () => {
                resolve(true)
            })
        })
    })
}