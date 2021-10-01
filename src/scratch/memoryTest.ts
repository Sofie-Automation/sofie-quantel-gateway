import request from 'request-promise-native'

const timer = (t: number) => new Promise((resolve, _reject) => {
	setTimeout(resolve, t)
})

async function run () {
	let counter = 0
	while (counter <= 10000) {
		try {
			// await (request('http://localhost:3000/default/server', { json: true }))
			// await (request('http://localhost:3000/', { json: true }))
			// await (request('http://localhost:3000/connect', { json: true }))
			await Promise.all([
				request('http://localhost:3000/default/server', { json: true }),
				request('http://localhost:3000/', { json: true }),
				request('http://localhost:3000/connect', { json: true }) ])
			console.log(counter++)
			await timer(50)
		} catch (error) {
			console.error(counter++)
		}
	}
}

run().catch(console.error)
