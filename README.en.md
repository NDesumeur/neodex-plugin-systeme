# Système (System)

A live dashboard of your PC: processor, memory, temperature, network, cores, the programs using the most memory, disks and general information. Measurements are taken every second, and the charts show the last 5 minutes.

*Version française : [README.md](README.md)*

## The four gauges at the top

- **Processor**: current usage in %, with the processor name and its number of logical cores.
- **Memory**: memory used out of the total, in GB.
- **Network**: what is being received and sent right now (B/s, KB/s, MB/s).
- **Temperature**: the motherboard sensor, when Windows provides it. On many PCs Windows only gives it to administrators; the plugin then says so instead of showing a value.

## Charts

- **Processor and memory** and **Network** (received, sent) over the last 5 minutes, with the average over the period.
- Hover over a chart: a marker shows the values at that moment ("2 min 10 s ago").

## Details

- **Processor cores**: one bar per core, and how many cores are above 80 % (or "no core saturated").
- **Memory per program**: the programs using the most memory, from most to least.
- **Disks**: free space out of the total for each disk; a disk more than 90 % full is highlighted.
- **This PC**: the PC name, the Windows version, how long it has been on, the memory used by NeoDex and, on a laptop, the battery level and whether it is charging.

Measurements stop as soon as you leave the tab, so nothing runs in the background.

## Data and sync

Nothing is stored or synced: everything is measured live.

## Install

In NeoDex: **NeoStore → Discover → Système → Install**.

Building a plugin: see the [NeoDex SDK](https://github.com/NDesumeur/neodex-sdk).
