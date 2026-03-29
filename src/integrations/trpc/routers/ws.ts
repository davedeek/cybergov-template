import { createTRPCRouter } from '../init'
import { unitsRouter } from './ws/units'
import { wdcRouter } from './ws/wdc'
import { processChartRouter } from './ws/process'

export const wsRouter = createTRPCRouter({
  units: unitsRouter,
  wdc: wdcRouter,
  processChart: processChartRouter,
})
