(async () => {
	const steamcmd = require('./util/steamcmd')
	const reg = require('./util/registry')
	const progress = require('./util/progress')
	const fs = require('fs-extra')
	const enquirer = require('enquirer')
	const figlet = require('figlet')
	const chalk = require('chalk')
	const vdf_parser = require('vdf-parser')
	const appDirectory = require('path').dirname(process.pkg ? process.execPath : (require.main ? require.main.filename : process.argv[0])).replace(/\\/g, '/')
	let i;

	figlet.parseFont('Slant2', fs.readFileSync(__dirname + '/assets/Slant.flf', 'utf8'))
	console.log(chalk.green(figlet.textSync('CSSource installer', {
		font: 'Slant2',
		horizontalLayout: 'fitted',
		verticalLayout: 'fitted'
	}) + chalk.blueBright('v1.1.0 stable')))
	console.log(chalk.magenta(`A utility designed to help make installing CSSource textures into Garry's Mod ${chalk.blue('safe')} while also using the ${chalk.blue('legal method')} by utilizing steamcmd.`))
	console.log(chalk.hex('#7289DA')(`Have any questions? Join my discord: https://discord.gg/kb4KREA`))
	progress.start('Verifying steam directory...')

	let steamIPath = await (async () => {
		return new Promise(function (resolve) {
			reg.list('HKCU\\SOFTWARE\\Valve\\Steam', (registry) => {
				if (!registry) {
					reg.list('HKLM\\SOFTWARE\\Valve\\Steam', (registry) => {
						if (!registry) {
							reg.list('HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', (registry) => {
								if (!registry) resolve(registry)
								else resolve(registry.InstallPath.value)
							})
						} else resolve(registry.InstallPath.value)
					})

				} else resolve(registry.SteamPath.value)
			})
		})
	})()

	if (!steamIPath) {
		return progress.fail('Steam could not be found on your computer.\nAutomatically closing window in 10 seconds.', 10000)
	}
	progress.succeed(`Steam installation directory found: ${steamIPath}`)
	let gmodIPath = await (async () => {
		return new Promise(function (resolve) {
			if (fs.existsSync(steamIPath + "/steamapps/appmanifest_4000.acf")) {
				resolve(steamIPath + "/steamapps/common/GarrysMod")
			} else if (fs.existsSync(steamIPath + "/steamapps/libraryfolders.vdf")) {
				var libraryfolders_vdf = vdf_parser.parse(fs.readFileSync(steamIPath + "/steamapps/libraryfolders.vdf").toString())
				if ("libraryfolders" in libraryfolders_vdf) {
					for (e in libraryfolders_vdf["libraryfolders"]) {
						var _e = libraryfolders_vdf["libraryfolders"][e]
						if ("4000" in _e["apps"]) {
							resolve(_e["path"].replace("\\\\", "/") + "/steamapps/common/GarrysMod")
							return
						}
					}
					resolve(false)
				} else resolve(false)
			} else resolve(false)
		})
	})()
	if (!gmodIPath) {
		return progress.fail('Garrys Mod could not be found on your computer.\nAutomatically closing window in 10 seconds.', 10000)
	}
	progress.succeed(`Garrys Mod installation directory found: ${gmodIPath}`)
	progress.start('Checking for steamcmd...')
	if (!fs.existsSync(appDirectory + '/steam/steamcmd.exe')) {
		await (async () => {
			return new Promise(async function (resolve) {
				progress.update('Downloading steamcmd.exe: 0%')
				steamcmd.installToPath(`${appDirectory}/steamcmd.zip`, (dat) => {
					if (dat.type === 'download') {
						progress.update(`Downloading steamcmd.exe: ${dat.percent}%`)
					}
					if (dat.type === 'unzip') {
						progress.update(`Extracting steamcmd.exe: ${dat.percent}% | ${dat.files} files`)
					}
				}).then((dat) => {
					if (dat.success) {
						fs.unlinkSync(dat.path)
						progress.succeed(`Steamcmd.exe downloaded and extracted: ${appDirectory + '/steam/steamcmd.exe'}`)
						resolve()
					}
				})
			})
		})()
	} else {
		progress.succeed(`Steamcmd.exe found: ${appDirectory + '/steam/steamcmd.exe'}`)
	}
	if (fs.existsSync(appDirectory + '/cssource')) {
		progress.start(`Found cssource folder. This most likely may have been generated from past usage of the program, and as such is being automatically removed.`)
		fs.removeSync(appDirectory + '/cssource')
		progress.succeed(`Cssource folder removed.`)
	}
	enquirer.prompt({
		type: 'confirm',
		name: 'install',
		message: 'Would you like to start installing the CSSource textures?'
	}).then(async choice => {
		if (!choice.install) return progress.fail('Installation cancelled.\nAutomatically closing window in 10 seconds.', 10000)
		progress.log('Installation started...')
		progress.start('Preparing Counter-Strike Source dedicated server files...\nthis may take a minute or two as steamcmd configures itself')

		i = await (async () => {
			return new Promise(async (resolve, reject) => {
				steamcmd.download('232330', [
					'login anonymous',
					'force_install_dir ../cssource',
					'app_update {{app_id}} -validate'
				], (dat) => {
					if (dat.code === '0x3') {
						return progress.update(`Preparing Counter-Strike Source dedicated server files: ${Math.ceil(dat.progress)}%`)
					}
					if (dat.code === '0x5') {
						return progress.update(`Validating Counter-Strike Source dedicated server files: ${Math.ceil(dat.progress)}%`)
					}
					if (dat.code === '0x61') {
						return progress.update(`Downloading Counter-Strike Source dedicated server files: ${Math.ceil(dat.progress)}%`)
					}
					if (dat.code === '0x101') {
						return progress.update(`Commiting Counter-Strike Source dedicated server files: ${Math.ceil(dat.progress)}%`)
					}
					return progress.update('Error: unexpected code. Perhaps try rerunning the program.\nAutomatically closing window in 10 seconds.', 10000)
				}).then(() => {
					progress.succeed('Downloaded Counter-Strike Source dedicated server files.')
					resolve(true)
				}).catch((err) => {
					resolve(err)
				})
			})
		})()
		if (typeof i !== 'boolean') return progress.fail(`Error: ${i}.\nAutomatically closing window in 10 seconds.`, 10000)
		i = await (async () => {
			return new Promise(async (resolve, reject) => {
				progress.start('Extracting Counter-Strike Source dedicated server files...')
				steamcmd.extract(appDirectory + '/cssource/cstrike/cstrike_pak_dir.vpk', (dat) => {
					progress.update(`Extracting Counter-Strike Source dedicated server files: ${dat.file}`)
				}).then(() => {
					progress.succeed(`Extracted Counter-Strike Source dedicated server files.`)
					resolve(true)
				}).catch((err) => {
					resolve(err)
				})
			})
		})()
		if (typeof i !== 'boolean') return progress.fail(`Error: ${i}.\nAutomatically closing window in 10 seconds.`, 10000)
		progress.start('Moving Counter-Strike Source textures into Garrys Mod... The console may freeze, this is normal.')
		if (fs.existsSync(`${gmodIPath}/addons/css_content`)) {
			progress.update('Deleting old css_content folder...')
			fs.removeSync(`${gmodIPath}/addons/css_content`)
		}
		fs.ensureDirSync(`${gmodIPath}/addons/css_content`)
		const copySet = ['materials', 'models', 'particles', 'sound', 'resource', 'maps']
		for (let folder of copySet) {
			progress.update(`Moving ${folder} into ${gmodIPath}/addons/css_content/${folder}`)
			fs.moveSync(`${appDirectory}/cssource/cstrike/cstrike_pak_dir/${folder}`, `${gmodIPath}/addons/css_content/${folder}`)
		}
		progress.succeed(`Successfully moved ${copySet} from ${appDirectory}/cssource/cstrike/cstrike_pak_dir/ to ${gmodIPath}/addons/css_content/`)
		progress.start('Cleaning up...')
		const removeSet = ['cssource', 'steam']
		for (let folder of removeSet) {
			if (fs.existsSync(`${appDirectory}/${folder}`)) fs.removeSync(`${appDirectory}/${folder}`)
		}
		progress.succeed(`The Counter-Strike Source textures have been successfully installed into Garrys Mod.\nInstallation path: ${gmodIPath}/addons/css_content`)
		progress.log('You may now close this console window.')
	})
})()