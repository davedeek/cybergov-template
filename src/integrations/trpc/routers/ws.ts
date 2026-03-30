import { createTRPCRouter } from '../init'
import { unitsRouter } from './ws/units'
import { wdcRouter } from './ws/wdc'
import { processChartRouter } from './ws/process'
import { changesRouter } from './ws/changes'
import { workCountRouter } from './ws/workcount'

export const wsRouter = createTRPCRouter({
  units: unitsRouter,
  wdc: wdcRouter,
  processChart: processChartRouter,
  changes: changesRouter,
  workCount: workCountRouter,
})
