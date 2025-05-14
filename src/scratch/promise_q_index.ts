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

import request from 'request-promise-native'

const quantel = require('../build/Release/quantel_gateway')

export namespace Quantel {

	let isaIOR: Promise<string> | null = null
	let stickyRef: string = 'http://localhost:2096'
	let queue: Promise<any> = Promise.resolve()

	export interface ZoneInfo {
		type: 'ZonePortal'
		zoneNumber: number
		zoneName: string
		isRemote: boolean
	}

	export interface ServerInfo {
		type: 'Server'
		ident: number
		down: boolean
		name?: string
		numChannels?: number
		pools?: number[]
		portNames?: string[]
		chanPorts?: string[]
	}

	export interface PortRef {
		serverID: number | string
		portName: string
	}

	export interface PortInfo extends PortRef {
		type?: 'PortInfo'
		channelNo: number
		portID?: number
		audioOnly?: boolean
		assigned?: boolean
	}

	export interface PortStatus extends PortRef {
		type: 'PortStatus'
		portID: number
		refTime: string
		portTime: string
		speed: number
		offset: number
		status: string
		endOfData: number
		framesUnused: number
		outputTime: string
		channels: number[]
		videoFormat: string
	}

	export interface ReleaseStatus extends PortRef {
		type: 'ReleaseStatus'
		released: boolean
	}

	export interface ClipRef {
		clipID: number
	}

	export interface FragmentRef extends ClipRef {
		start?: number
		finish?: number
	}

	export interface PortFragmentRef extends PortRef {
		start?: number
		finish?: number
	}

	export interface ClipPropertyList {
		// Use property 'limit' of type number to set the maximum number of values to return
		[ name: string ]: string | number
	}

	export interface ClipDataSummary {
		type: 'ClipDataSummary' | 'ClipData'
		ClipID: number
		ClipGUID: string
		CloneId: number | null
		Completed: Date | null
		Created: Date // ISO-formatted date
		Description: string
		Frames: string // TODO ISA type is None ... not sure whether to convert to number
		Owner: string
		PoolID: number | null
		Title: string
	}

	export interface ClipData extends ClipDataSummary {
		type: 'ClipData'
		Category: string
		CloneZone: number | null
		Destination: number | null
		Expiry: Date | null // ISO-formatted date
	 	HasEditData: number | null
		Inpoint: number | null
		JobID: number | null
		Modified: string | null
		NumAudTracks: number | null
		Number: number | null
		NumVidTracks: number | null
		Outpoint: number | null
		PlaceHolder: boolean
		PlayAspect: string
		PublishedBy: string
		Register: string
		Tape: string
		Template: number | null
		UnEdited: number | null
		PlayMode: string
		MosActive: boolean
		Division: string
		AudioFormats: string
		VideoFormats: string
		Protection: string
		VDCPID: string
		PublishCompleted: Date | null // ISO-formatted date
	}

	export interface ServerFragment {
		type: string
		trackNum: number
		start: number
		finish: number
	}

	export type ServerFragmentTypes =
		VideoFragment |
		AudioFragment |
		AUXFragment |
		FlagsFragment |
		TimecodeFragment |
		AspectFragment |
		CropFragment |
		PanZoomFragment |
		SpeedFragment |
		MultiCamFragment |
		CCFragment |
		NoteFragment |
		EffectFragment

	interface PositionData extends ServerFragment {
		rushID: string
		format: number
		poolID: number
		poolFrame: number
		skew: number
		rushFrame: number
	}

	export interface VideoFragment extends PositionData {
		type: 'VideoFragment'
	}

	export interface AudioFragment extends PositionData {
		type: 'AudioFragment'
	}

	export interface AUXFragment extends PositionData {
		type: 'AUXFragment'
	}

	export interface FlagsFragment extends ServerFragment {
		type: 'FlagsFragment'
		flags: number
	}

	export interface TimecodeFragment extends ServerFragment {
		startTimecode: string
		userBits: number
	}

	export interface AspectFragment extends ServerFragment {
		type: 'AspectFragment'
		width: number
		height: number
	}

	export interface CropFragment extends ServerFragment {
		type: 'CropFragment'
		x: number
		y: number
		width: number
		height: number
	}

	export interface PanZoomFragment extends ServerFragment {
		type: 'PanZoomFragment'
		x: number
		y: number
		hZoom: number
		vZoon: number
	}

	export interface SpeedFragment extends ServerFragment {
		type: 'SpeedFragment'
		speed: number
		profile: number
	}

	export interface MultiCamFragment extends ServerFragment {
		type: 'MultiCamFragment'
		stream: number
	}

	export interface CCFragment extends ServerFragment {
		type: 'CCFragment'
		ccID: string
		ccType: number
		effectID: number
	}

	export interface NoteFragment extends ServerFragment {
		type: 'NoteFragment'
		noteID: number
		aux: number
		mask: number
		note: string | null
	}

	export interface EffectFragment extends ServerFragment {
		type: 'EffectFragment'
		effectID: number
	}

	export interface ServerFragments extends ClipRef {
		type: 'ServerFragments'
		fragments: ServerFragmentTypes[]
	}

	export interface PortServerFragments extends ServerFragments, PortRef {
		clipID: -1
	}

	export interface PortLoadInfo extends PortRef {
		fragments: ServerFragmentTypes[]
		offset?: number
	}

	export interface PortLoadStatus extends PortRef {
		type: 'PortLoadStatus'
		fragmentCount: number
		offset: number
	}

	export enum Trigger {
		START = quantel.START,
		STOP = quantel.STOP,
		JUMP = quantel.JUMP,
		TRANSITION = quantel.TRANSITION
	}

	export interface TriggerInfo extends PortRef {
		trigger: Trigger
		offset?: number
	}

	export interface TriggerResult extends TriggerInfo {
		type: 'TriggerResult'
		success: boolean
	}

	export interface JumpInfo extends PortRef {
		offset: number
	}

	export interface JumpResult extends JumpInfo {
		type: 'HardJumpResult' | 'TriggeredJumpResult'
		success: boolean
	}

	export interface ThumbnailSize {
		width: number
		height: number
	}

	export interface ThumbnailOrder extends ClipRef {
		offset: number
		stride: number
		count: number
	}

	export interface ConnectionDetails {
		type: string
		isaIOR: string | null
		href: string
	}

	export interface CloneRequest extends ClipRef {
		poolID: number
		highPriority?: boolean
	}

	export interface WipeInfo extends PortRef {
		start?: number
		frames?: number
	}

	export interface WipeResult extends WipeInfo {
		type: 'WipeResult'
		wiped: boolean
	}

	export interface FormatRef {
		formatNumber: number
	}

	export interface FormatInfo extends FormatRef {
		type: 'FormatInfo'
		essenceType: 'VideoFragment' | 'AudioFragment' | 'AUXFragment' | 'FlagsFragment' |
			'TimecodeFragment' | 'AspectFragment' | 'CropFragment' | 'PanZoomFragment' |
			'MultiCamFragment' | 'CCFragment' | 'NoteFragment' | 'EffectFragment' | 'Unknown',
		frameRate: number
		height: number
		width: number
		samples: number
		compressionFamily: number
		protonsPerAtom: number
		framesPerAtom: number
		quark: number
		formatName: string
		layoutName: string
		compressionName: string
	}

	export class ConnectError extends Error {
		public statusCode: number
		constructor (message?: string | undefined, statusCode?: number) {
			super(message)
			this.statusCode = statusCode ? statusCode : 500
		}
		get status () {
			return this.statusCode
		}
	}

	export async function getISAReference (ref?: string): Promise<ConnectionDetails> {
		if (isaIOR === null || ref) isaIOR = Promise.reject()
		if (ref) { stickyRef = ref }
		isaIOR = isaIOR.then(x => x, () => new Promise((resolve, reject) => {
			if (stickyRef.endsWith('/')) { stickyRef = stickyRef.slice(0, -1) }
			if (stickyRef.indexOf(':') < 0) { stickyRef = stickyRef + ':2096' }
			request({
				uri: stickyRef + '/ZoneManager.ior',
				resolveWithFullResponse: true
			}).then(res => {
				if (res.statusCode === 200) {
					resolve(res.body)
				} else {
					reject(new ConnectError(
						`HTTP request for ISA IOR failed with status ${res.statusCode}: ${res.statusMessage}`,
						res.statusCode))
				}
			}, err => {
				reject(err)
			})
		}))
		return {
			type: 'ConnectionDetails',
			isaIOR: await isaIOR,
			href: stickyRef
		}
	}

	export async function getConnectionDetails (): Promise<ConnectionDetails> {
		return {
			type: 'ConnectionDetails',
			isaIOR: isaIOR ? await isaIOR : null,
			href: stickyRef
		}
	}

	// Resolves to 'PONG!' on success, otherwise rejects with a connection error
	export async function testConnection (): Promise<string> {
		try {
			await getISAReference()
			return await quantel.testConnection(await isaIOR)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return testConnection()
			}
			throw err
		}
	}

	export async function listZones (): Promise<ZoneInfo[]> {
		try {
			await getISAReference()
			return await quantel.listZones(await isaIOR)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return listZones()
			}
			throw err
		}
	}

	export async function getDefaultZoneInfo (): Promise<ZoneInfo> {
		try {
			await getISAReference()
			queue = queue.then(async () => quantel.listZones(await isaIOR))
			let zones = await queue
			return zones[0]
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return getDefaultZoneInfo()
			}
			throw err
		}
	}

	export async function getServers (): Promise<ServerInfo[]> {
		try {
			await getISAReference()
			queue = queue.then(async () => quantel.getServers(await isaIOR))
			return queue
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return getServers()
			}
			throw err
		}
	}

	export async function getFormatInfo (options: FormatRef): Promise<FormatInfo> {
		try {
			await getISAReference()
			return await quantel.getFormatInfo(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return getFormatInfo(options)
			}
			throw err
		}
	}

	export interface Formats {
		[key: number]: FormatInfo,
	}

	export async function getFormats (): Promise<Formats> {
		try {
			await getISAReference()
			let isaRef = await isaIOR
			let formats: Formats = {}
			for (let x = 0 ; x < 900 ; x++) {
				let format: FormatInfo | null =
					await quantel.getFormatInfo(isaRef, { formatNumber: x }).then((x: FormatInfo) => x, () => null)
				if (format) {
					formats[format.formatNumber] = format
				}
			}
			return formats
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return getFormats()
			}
			throw err
		}
	}

	async function checkServer (options: PortRef): Promise<ServerInfo> {
		let servers = await quantel.getServers(await isaIOR)
		let server = servers.find((x: ServerInfo) =>
			x.ident === +options.serverID || x.name === options.serverID)
		if (!server) {
			throw new ConnectError(`Not found. Could not find a server with identifier '${options.serverID}'.`, 404)
		}
		options.serverID = server.ident
		return server
	}

	// TODO: allow assignment of more than one channel
	export async function createPlayPort (options: PortInfo): Promise<PortInfo> {
		try {
			await getISAReference()
			let server = await checkServer(options)
			if (server.portNames && server.portNames.indexOf(options.portName) >= 0) {
				let portStatus: PortStatus = await quantel.getPlayPortStatus(await isaIOR, options)
				if (portStatus.channels.indexOf(options.channelNo) < 0) {
					throw new ConnectError(`Conflict. Port '${options.portName}' on server '${options.serverID}' is already assigned to channels '[${portStatus.channels}]' and cannot be assigned to channel '${options.channelNo}'.`, 409)
				}
				return {
					type: 'PortInfo',
					serverID: options.serverID,
					portName: options.portName,
					channelNo: options.channelNo,
					portID: portStatus.portID,
					assigned: false
				} as PortInfo
			}
			if (isNaN(+options.channelNo) || +options.channelNo < 0) {
				throw new ConnectError('Bad request. Channel number must be a non-negative integer.', 400)
			}
			if (server.chanPorts && options.channelNo >= server.chanPorts.length) {
				throw new ConnectError(`Bad request. Channel number of '${options.channelNo}' exceeds maximum index for server of '${ server.chanPorts.length - 1}'.`, 400)
			}
			if (server.chanPorts && server.chanPorts[options.channelNo].length !== 0) {
				throw new ConnectError(`Bad request. Cannot assign channel '${options.channelNo}' to port '${options.portName}' on server '${options.serverID}' as it is already assigned to port '${server.chanPorts[options.channelNo]}'.`, 400)
			}

			return await quantel.createPlayPort(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return createPlayPort(options)
			}
			throw err
		}
	}

	async function checkServerPort (options: PortRef): Promise<ServerInfo> {
		let server = await checkServer(options)
		if (server.portNames && server.portNames.indexOf(options.portName) < 0) {
			throw new ConnectError(`Not found. Could not find a port called '${options.portName}' on server '${server.name}'.`, 404)
		}
		return server
	}

	export async function getPlayPortStatus (options: PortRef): Promise<PortStatus> {
		try {
			await getISAReference()
			await checkServerPort(options)
			return await quantel.getPlayPortStatus(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return getPlayPortStatus(options)
			}
			throw err
		}
	}

	export async function releasePort (options: PortRef): Promise<ReleaseStatus> {
		try {
			await getISAReference()
			await checkServerPort(options)
			return await quantel.releasePort(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return releasePort(options)
			}
			throw err
		}
	}

	export async function getClipData (options: ClipRef): Promise<ClipData> {
		try {
			await getISAReference()
			return await quantel.getClipData(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return getClipData(options)
			}
			throw err
		}
	}

	export async function searchClips (options: ClipPropertyList): Promise<ClipDataSummary[] | Number[]> {
		try {
			await getISAReference()
			return await quantel.searchClips(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return searchClips(options)
			}
			throw err
		}
	}

	export async function getFragments (options: FragmentRef): Promise<ServerFragments> {
		try {
			await getISAReference()
			if (options.start && options.finish && options.start >= options.finish) {
				throw new RangeError(`Finish point ${options.finish} cannot be before start point ${options.start}.`)
			}
			return await quantel.getFragments(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return getFragments(options)
			}
			throw err
		}
	}

	export async function loadPlayPort (options: PortLoadInfo): Promise<PortLoadStatus> {
		try {
			await getISAReference()
			await checkServerPort(options)
			return await quantel.loadPlayPort(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return loadPlayPort(options)
			}
			throw err
		}
	}

	export async function getPortFragments (options: PortFragmentRef): Promise<PortServerFragments> {
		try {
			await getISAReference()
			await checkServerPort(options)
			return await quantel.getPortFragments(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return getPortFragments(options)
			}
			throw err
		}
	}

	export async function trigger (options: TriggerInfo): Promise<TriggerResult> {
		try {
			await getISAReference()
			await checkServerPort(options)
			return {
				type: 'TriggerResult',
				serverID: options.serverID,
				portName: options.portName,
				trigger: options.trigger,
				offset: options.offset,
				success: await quantel.trigger(await isaIOR, options)
			}
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return trigger(options)
			}
			throw err
		}
	}

	export async function jump (options: JumpInfo): Promise<JumpResult> {
		try {
			await getISAReference()
			await checkServerPort(options)
			return {
				type: 'HardJumpResult',
				serverID: options.serverID,
				portName: options.portName,
				offset: options.offset,
				success: await quantel.jump(await isaIOR, options)
			}
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return jump(options)
			}
			throw err
		}
	}

	export async function setJump (options: JumpInfo): Promise<JumpResult> {
		try {
			await getISAReference()
			await checkServerPort(options)
			return {
				type: 'TriggeredJumpResult',
				serverID: options.serverID,
				portName: options.portName,
				offset: options.offset,
				success: await quantel.setJump(await isaIOR, options)
			}
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return setJump(options)
			}
			throw err
		}
	}

	export async function getThumbnailSize (): Promise<ThumbnailSize> {
		try {
			await getISAReference()
			return quantel.getThumbnailSize(await isaIOR)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return getThumbnailSize()
			}
			throw err
		}
	}

	export async function requestThumbnails (options: ThumbnailOrder): Promise<Buffer> {
		await getISAReference()
		let b = quantel.requestThumbnails(await isaIOR, options)
		// writeFileSync(`test${options.offset}.argb`, b)
		return b
	}

	/*
	Clone process ... (otherwise known as here is a bag of bits ... go figure)

	1) Call clone if needed with the pool number (<poolID>) of a server with a port you want to play on
	2) If result is true, cloning has started. Otherwise, skip to 4.
	3) Query for a clip with CloneID=<clipID>&PoolID=<poolID>. Replace the <clipID> with that of the result
	4) Get the fragments for <clipID>
	5) Load the fragments onto the target port

	Plan is to hide this behind the REST API
	*/
	export async function cloneIfNeeded (options: CloneRequest): Promise<boolean> {
		try {
			await getISAReference()
			return await quantel.cloneIfNeeded(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return cloneIfNeeded(options)
			}
			throw err
		}
	}

	export async function deleteClip (options: ClipRef): Promise<boolean> {
		try {
			await getISAReference()
			return await quantel.deleteClip(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return deleteClip(options)
			}
			throw err
		}
	}

	export async function wipe (options: WipeInfo): Promise<WipeResult> {
		try {
			await getISAReference()
			await checkServerPort(options)
			return await quantel.wipe(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return wipe(options)
			}
			throw err
		}
	}

	export async function getPortProperties (options: PortRef): Promise<any> {
		try {
			await getISAReference()
			await checkServerPort(options)
			return await quantel.getPortProperties(await isaIOR, options)
		} catch (err) {
			if (err.message.indexOf('TRANSIENT') >= 0) { isaIOR = null }
			if (err.message.indexOf('OBJECT_NOT_EXIST') >= 0) {
				isaIOR = null
				return wipe(options)
			}
			throw err
		}
	}

	const tcPattern = /[0-2][0-9]:[0-5][0-9]:[0-5][0-9](:|;)[0-9][0-9]/

	export function timecodeToBCD (timecode: string): number {
		if (!tcPattern.test(timecode)) {
			throw new TypeError('Timecode string does not match an accceptable pattern for conversion.')
		}
		return quantel.timecodeToBCD(timecode)
	}

	export function timecodeFromBCD (timecode: number): string {
		let result = quantel.timecodeFromBCD(timecode)
		if (!tcPattern.test(result)) {
			throw new TypeError('Given number does not map to a valid timecode.')
		}
		return result
	}
}
