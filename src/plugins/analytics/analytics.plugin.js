import { PluginBase } from '../core/plugin.base.js'

export class AnalyticsPlugin extends PluginBase {
  async boot() {
    console.log('Analytics Plugin Booted')
  }
}
