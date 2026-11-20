// Détoure le sujet principal d'une image avec Vision (macOS 14+), sans modèle à télécharger.
//   swift outils/detourer.swift entree.jpg sortie-masque.png
// Écrit un masque en niveaux de gris (blanc = sujet), à la taille de l'image d'entrée.
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
guard args.count == 3, let image = CIImage(contentsOf: URL(fileURLWithPath: args[1])) else {
    FileHandle.standardError.write("usage : detourer entree.jpg masque.png\n".data(using: .utf8)!); exit(2)
}
let requete = VNGenerateForegroundInstanceMaskRequest()
let gestion = VNImageRequestHandler(ciImage: image)
do { try gestion.perform([requete]) } catch { print("échec Vision : \(error)"); exit(1) }
guard let resultat = requete.results?.first, !resultat.allInstances.isEmpty else { print("aucun sujet détecté"); exit(3) }
let tampon = try resultat.generateScaledMaskForImage(forInstances: resultat.allInstances, from: gestion)
let masque = CIImage(cvPixelBuffer: tampon)
let contexte = CIContext()
guard let cg = contexte.createCGImage(masque, from: masque.extent) else { exit(4) }
let rep = NSBitmapImageRep(cgImage: cg)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
print("sujets : \(resultat.allInstances.count) · \(Int(masque.extent.width))×\(Int(masque.extent.height))")
