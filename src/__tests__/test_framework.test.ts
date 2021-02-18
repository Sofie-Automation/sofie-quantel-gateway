/*
	 Copyright (c) 2019 Norsk rikskringkasting AS (NRK)

	 This file is part of Sofie: The Modern TV News Studio Automation
	 System (Quantel gateway)

	 This program is free software; you can redistribute it and/or modify
	 it under the terms of the GNU General Public License as published by
	 the Free Software Foundation; either version 2 of the License, or
	 (at your option) any later version.

	 This program is distributed in the hope that it will be useful,
	 but WITHOUT ANY WARRANTY; without even the implied warranty of
	 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	 GNU General Public License for more details.

	 You should have received a copy of the GNU General Public License along
	 with this program; if not, write to the Free Software Foundation, Inc.,
	 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import { Quantel } from '../index'
import * as spawn from './spawn_server'
import { app } from '../server'
import { Server } from 'http'
import * as request from 'request-promise-native'

// const wait = (t: number): Promise<void> => { 
// 	return new Promise((resolve) => {
// 		setTimeout(resolve, t)
// 	})
// }

describe('Test framework', () => {

	let isaIOR: string
	let server: Server

	beforeAll(async () => {
		isaIOR = await spawn.start()
		await new Promise<void>((resolve, reject) => {
			server = app.listen(3000) // TODO change this to a config parameter
			server.on('listening', () => {
				resolve()
			})
			server.on('error', e => {
				reject(e)
			})
		})
	})

	test('Default request for connection fails before first connect', async () => {
		await expect(Quantel.getISAReference()).rejects.toThrow('First provide')
	})

	test('Health endpoint in a warning state', async () => {
		await expect(request.get('http://localhost:3000/health', { json: true })).resolves.toMatchObject({
			status: 'WARNING',
			name: 'Sofie Automation Quantel Gateway',
			documentation: 'https://github.com/nrkno/tv-automation-quantel-gateway',
			version: '3',
			statusMessage: 'Waiting for connection request to Quantel server.'
		})
	})

	test('Default get connection reference with localhost', async () => {
		await expect(Quantel.getISAReference('http://localhost:2096')).resolves.toStrictEqual({
			type: 'ConnectionDetails',
			href: 'http://localhost:2096',
			isaIOR,
		 	refs: ['http://localhost:2096' ],
			robin: 0 } as Quantel.ConnectionDetails)
	})

	test('Test CORBA connection', async () => {
		await expect(Quantel.testConnection()).resolves.toEqual('PONG!')
	})

	test('Test HTTP API is running', async () => {
		await expect(request.post('http://localhost:3000/connect/127.0.0.1')).resolves.toBeTruthy()
	})

	test('Health endpoint in a good state', async () => {
		await expect(request.get('http://localhost:3000/health', { json: true })).resolves.toMatchObject({
			status: 'OK',
			name: 'Sofie Automation Quantel Gateway',
			documentation: 'https://github.com/nrkno/tv-automation-quantel-gateway',
			version: '3',
			statusMessage: 'Functioning as expected - last response was successful'
		})
	})

	test('Bad route', async () => {
		await expect(request.get('http://localhost:3000/default/wrong', { json: true }).then(x => x, x => JSON.parse(x.message.slice(6))))
		.resolves.toEqual({
			status: 404,
			message: 'Not found. Request GET /default/wrong',
			stack: ''
		})
		await expect(request.get('http://localhost:3000/default/wrong'))
		.rejects.toThrow('Not found. Request GET /default/wrong')
	})

	test('Convert BCD timecode to string', () => {
		expect(Quantel.timecodeFromBCD(0x10111213)).toBe('10:11:12:13')
		expect(Quantel.timecodeFromBCD(0)).toBe('00:00:00:00')
		expect(Quantel.timecodeFromBCD(0x23595924)).toBe('23:59:59:24')
		expect(Quantel.timecodeFromBCD(0x23595929 | 0x40000000)).toBe('23:59:59;29')
		expect(() => Quantel.timecodeFromBCD(11)).toThrow('Given number does not map to a valid timecode')
	})

	test('Convert string timecode to BCD', () => {
		expect(Quantel.timecodeToBCD('10:11:12:13')).toBe(0x10111213)
		expect(Quantel.timecodeToBCD('00:00:00:00')).toBe(0)
		expect(Quantel.timecodeToBCD('23:59:59:24')).toBe(0x23595924)
		expect(Quantel.timecodeToBCD('23:59:59;29')).toBe(0x23595929 | 0x40000000)
		expect(() => Quantel.timecodeToBCD('00:61:00:00')).toThrow('Timecode string does not match an accceptable pattern for conversion')
	})

	afterAll(async () => {
		Quantel.destroyOrb()
		await new Promise<void>((resolve, reject) => {
			server.close(e => {
				if (e) {
					reject(e)
				} else { resolve() }
			})
		})
		await spawn.stop()
	})
})

describe('Error handling when no server running', () => {

	test('Test failed IOR HTTP connection', async () => {
		expect.assertions(1)
		await expect(Quantel.getServers()).rejects.toThrow('TIMEOUT')
	})

	test('Test fail to get servers 1', async () => {
		expect.assertions(1)
		await expect(Quantel.getServers()).rejects.toThrow('ECONNREFUSED')
	})
})

describe('Error handling when server has failed', () => {

	let isaIOR: string

	beforeAll(async () => {
		isaIOR = await spawn.start()
	})

	test('Default get connection reference and close', async () => {
		await expect(Quantel.getISAReference()).resolves.toStrictEqual({
			type: 'ConnectionDetails',
			href: 'http://127.0.0.1:2096',
			isaIOR,
			refs: [ 'http://127.0.0.1:2096' ],
		 	robin: 1 } as Quantel.ConnectionDetails)
	})

	test('Stopping server', async () => {
		await expect(spawn.stop()).resolves.toBeUndefined()
	})

	test('Test fail to get servers 1', async () => {
		expect.assertions(1)
		await expect(Quantel.getServers()).rejects.toThrow('TIMEOUT')
	})

	test('Test fail to get servers 2', async () => {
		expect.assertions(1)
		await expect(Quantel.getServers()).rejects.toThrow('ECONNREFUSED')
	})

	test('Test the failed CORBA connection', async () => {
		expect.assertions(1)
		await expect(Quantel.testConnection()).rejects.toThrow('ECONNREFUSED')
	})

	test('Restart server and get details', async () => {
		isaIOR = await spawn.start()
		// await new Promise((resolve) => setTimeout(() => resolve(), 1000))
		await expect(Quantel.testConnection()).resolves.toBe('PONG!')
		await expect(Quantel.getISAReference()).resolves.toStrictEqual({
			type: 'ConnectionDetails',
			href: 'http://127.0.0.1:2096',
			isaIOR,
		 	refs: [ 'http://127.0.0.1:2096' ],
			robin: 2 } as Quantel.ConnectionDetails)
	})

	test('Check that get servers now works', async () => {
		await expect(Quantel.getServers()).resolves.toBeTruthy()
	})

	afterAll(async () => {
		Quantel.destroyOrb()
		await spawn.stop()
	})
})

describe('Error handling when server has failed, two servers', () => {

	let isaIOR: string

	beforeAll(async () => {
		isaIOR = await spawn.start()
	})

	test('Default get connection reference and close', async () => {
		await expect(Quantel.getISAReference(['http://127.0.0.1:2096', 'http://localhost:2096' ]))
		.resolves.toStrictEqual({
			type: 'ConnectionDetails',
			href: 'http://127.0.0.1:2096',
			isaIOR,
			refs: [ 'http://127.0.0.1:2096', 'http://localhost:2096' ],
		 	robin: 2 } as Quantel.ConnectionDetails)
	})

	test('Stopping server', async () => {
		await expect(spawn.stop()).resolves.toBeUndefined()
	})

	test('Test fail to get servers 1', async () => {
		expect.assertions(1)
		await expect(Quantel.getServers()).rejects.toThrow('TIMEOUT')
	})

	test('Test the failed CORBA connection 1', async () => {
		expect.assertions(1)
		await expect(Quantel.testConnection()).rejects.toThrow('ECONNREFUSED')
	})

	test('Test the failed CORBA connection 2', async () => {
		expect.assertions(1)
		await expect(Quantel.testConnection()).rejects.toThrow('ECONNREFUSED')
	})

	test('Restart server and get details', async () => {
		isaIOR = await spawn.start()
		// await new Promise((resolve) => setTimeout(() => resolve(), 1000))
		await expect(Quantel.testConnection()).resolves.toBe('PONG!')
		await expect(Quantel.getISAReference()).resolves.toStrictEqual({
			type: 'ConnectionDetails',
			href: 'http://localhost:2096',
			isaIOR,
		 	refs: [ 'http://127.0.0.1:2096', 'http://localhost:2096' ],
			robin: 5 } as Quantel.ConnectionDetails)
	})

	test('Check that get servers now works', async () => {
		await expect(Quantel.getServers()).resolves.toBeTruthy()
	})

	afterAll(async () => {
		Quantel.destroyOrb()
		await spawn.stop()
	})
})

describe('Check overlapping requests on failure', () => {
	let isaIOR: string

	beforeAll(async () => {
		isaIOR = await spawn.start()
	})

	test('Default get connection reference and close', async () => {
		await expect(Quantel.getISAReference('http://127.0.0.1:2096'))
		.resolves.toStrictEqual({
			type: 'ConnectionDetails',
			href: 'http://127.0.0.1:2096',
			isaIOR,
			refs: [ 'http://127.0.0.1:2096' ],
		 	robin: 5 } as Quantel.ConnectionDetails)
	})

	test('Stopping server', async () => {
		await expect(spawn.stop()).resolves.toBeUndefined()
	})

	test('Test fail to get servers 1', async () => {
		expect.assertions(2)
		await Promise.all([
			expect(Quantel.getServers()).rejects.toThrow('TIMEOUT'),
			expect(Quantel.getServers()).rejects.toThrow('TIMEOUT') ])
	})

	test('Test the failed CORBA connection 1', async () => {
		expect.assertions(2)
		await Promise.all([
			expect(Quantel.testConnection()).rejects.toThrow('ECONNREFUSED'),
			expect(Quantel.testConnection()).rejects.toThrow('ECONNREFUSED') ])
	})

	test('Test the failed CORBA connection 2', async () => {
		expect.assertions(2)
		await Promise.all([
			expect(Quantel.testConnection()).rejects.toThrow('ECONNREFUSED'),
			expect(Quantel.getServers()).rejects.toThrow('ECONNREFUSED') ])
	})

	test('Restart server and get details', async () => {
		isaIOR = await spawn.start()
		// await new Promise((resolve) => setTimeout(() => resolve(), 1000))
		await expect(Quantel.testConnection()).resolves.toBe('PONG!')
		await expect(Quantel.getISAReference()).resolves.toStrictEqual({
			type: 'ConnectionDetails',
			href: 'http://127.0.0.1:2096',
			isaIOR,
		 	refs: [ 'http://127.0.0.1:2096' ],
			robin: 7 } as Quantel.ConnectionDetails)
	})

	test('Check that get servers now works', async () => {
		await expect(Quantel.getServers()).resolves.toBeTruthy()
	})

	afterAll(async () => {
		Quantel.destroyOrb()
		await spawn.stop()
	})
})
