// Rendu SVG → PNG avec AppKit (macOS), sans dépendance externe.
// Usage : swift scripts/render-icons.swift <entrée.svg> <sortie.png> <largeur> [hauteur] [...]
import AppKit

let args = Array(CommandLine.arguments.dropFirst())
var i = 0
while i + 2 < args.count {
  let input = URL(fileURLWithPath: args[i])
  let output = URL(fileURLWithPath: args[i + 1])
  let parts = args[i + 2].split(separator: "x").map { Int($0)! }
  let w = parts[0], h = parts.count > 1 ? parts[1] : parts[0]
  guard let image = NSImage(contentsOf: input) else { fatalError("Impossible de lire \(input.path)") }
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 4,
                             hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  rep.size = NSSize(width: w, height: h)
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  NSGraphicsContext.current?.imageInterpolation = .high
  image.draw(in: NSRect(x: 0, y: 0, width: w, height: h))
  NSGraphicsContext.restoreGraphicsState()
  try! rep.representation(using: .png, properties: [:])!.write(to: output)
  print("✓ \(output.lastPathComponent) \(w)×\(h)")
  i += 3
}
