var exec = require('child_process').exec;

module.exports = {
	list: (val, callback) => {
		exec(`REG QUERY ${val}`, function (err, stdout, stderr) {
			if (err) return callback(false)
			var obj = {}
			stdout = stdout.replace(/(\r)/gm, '').split('\n')
			stdout = stdout.filter(i => {
				return i !== ''
			})
			stdout.forEach((val, i) => {
				val = val.replace(/\s+/g, " ").trim().split(' ')
				if (3 < val.length || val.length !== 1) {
					let j = val.slice(2, val.length).join(' ')
					val.splice(2, val.length)
					val.push(j)
					obj[val[0]] = {
						type: val[1],
						value: val[2]
					}
				} else {
					stdout.splice(i, 1)
					stdout.length - 1
				}
				if (i === stdout.length - 1) {
					callback(obj)
				}
			})
		})
	}
}