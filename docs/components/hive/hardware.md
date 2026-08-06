---
title: Hardware
---

# Hardware

The physical side of a hive node: the board it runs on, the enclosure that keeps it alive in an
apiary, and the printable parts that hold the sensors in place.

## What it holds

- **`3d-print/`** — CAD files for the 3D-printable parts, authored in FreeCAD: the hive module
  (two revisions) and the sensor housing.
- **`pcb/`** — the board schematic, the ESP32 pinout, and reference datasheets for the parts used
  (ESP32, HX711 load-cell amplifier, CD74HC4067 multiplexer).

## Key facts

| | |
| --- | --- |
| License | CERN-OHL-S v2 — strongly reciprocal open hardware |
| CAD format | FreeCAD (`.FCStd`) |
| Sensing | Temperature and humidity, plus four load cells for hive weight |
| Power | Solar, sized to run a node unattended |

!!! note "Documentation in progress"

    The hardware repository does not yet publish a bill of materials, an assembly guide, or board
    revision notes. What exists today is the CAD and schematic files themselves. If you are
    building a node, open an issue on the repository rather than working from this page alone.

## Full documentation

<https://github.com/fablab-imperia/meshbee-hardware>

## Related

- [Firmware](firmware.md) — the code that runs on this board.
- [Architecture](../../architecture.md) — where a node sits in the system.
