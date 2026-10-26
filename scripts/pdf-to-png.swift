// Renders page 1 of a PDF to a transparent PNG whose longest side is <size> px (vector-sharp).
// Usage: swift scripts/pdf-to-png.swift <in.pdf> <out.png> <size>   (macOS, CoreGraphics)
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard let doc = CGPDFDocument(URL(fileURLWithPath: args[1]) as CFURL), let page = doc.page(at: 1) else { fatalError("no pdf") }
let box = page.getBoxRect(.mediaBox)
let longest = Double(args[3])!
let scale = longest / Double(max(box.width, box.height))
let w = Int((Double(box.width) * scale).rounded()), h = Int((Double(box.height) * scale).rounded())
print("mediaBox:", box, "→", w, "x", h)
let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                    space: CGColorSpace(name: CGColorSpace.sRGB)!,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.clear(CGRect(x: 0, y: 0, width: w, height: h))
ctx.scaleBy(x: CGFloat(scale), y: CGFloat(scale))
ctx.translateBy(x: -box.origin.x, y: -box.origin.y)
ctx.drawPDFPage(page)
let img = ctx.makeImage()!
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[2]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, img, nil)
CGImageDestinationFinalize(dest)
