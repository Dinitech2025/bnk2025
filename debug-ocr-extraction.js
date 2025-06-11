const { ocrSpace } = require('ocr-space-api-wrapper');
const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

// Configuration OCR
const API_KEY_OCR = 'K86617027088957';

async function debugOcrExtraction() {
    console.log('🔍 DEBUG OCR - Voir exactement ce qui est extrait');
    
    const pdfPath = 'pdfs/500Ar2.pdf';
    
    try {
        // Configuration standard
        let options = {
            format: 'png',
            out_dir: './temp/',
            out_prefix: 'debug_ocr',
            page: null,
            density: 600,
            width: 5100,
            height: 6600
        };
        
        console.log('🖼️ Conversion PDF en images...');
        await pdf.convert(pdfPath, options);
        
        const tempFiles = fs.readdirSync('./temp/').filter(f => f.startsWith('debug_ocr'));
        console.log(`📸 ${tempFiles.length} images générées\n`);
        
        // Analyser seulement la première page pour debug
        const imagePath = path.join('./temp/', tempFiles[0]);
        console.log(`🔍 ANALYSE DEBUG - Page 1:`);
        
        const ocrResult = await ocrSpace(imagePath, {
            apiKey: API_KEY_OCR,
            language: 'eng',
            isOverlayRequired: false,
            detectOrientation: true,
            scale: true,
            isTable: false,
            OCREngine: 2
        });
        
        if (ocrResult && ocrResult.ParsedResults && ocrResult.ParsedResults[0]) {
            const text = ocrResult.ParsedResults[0].ParsedText;
            const lignes = text.split('\n');
            
            console.log(`📝 Total lignes extraites: ${lignes.length}`);
            console.log(`📝 Longueur du texte: ${text.length} caractères\n`);
            
            // Afficher les 50 premières lignes
            console.log('📖 PREMIÈRES 50 LIGNES EXTRAITES:');
            console.log('=' .repeat(80));
            lignes.slice(0, 50).forEach((ligne, i) => {
                const ligneClean = ligne.trim();
                if (ligneClean.length > 0) {
                    console.log(`${(i + 1).toString().padStart(3, ' ')}: "${ligneClean}"`);
                }
            });
            
            console.log('\n' + '=' .repeat(80));
            
            // Chercher des patterns spécifiques
            console.log('\n🔍 RECHERCHE DE PATTERNS:');
            
            // 1. Chercher "DT" ou "WIFI" ou "ZONE"
            const lignesAvecDT = lignes.filter(l => l.toLowerCase().includes('dt') || l.toLowerCase().includes('wifi') || l.toLowerCase().includes('zone'));
            console.log(`📍 Lignes contenant "DT/WIFI/ZONE": ${lignesAvecDT.length}`);
            lignesAvecDT.slice(0, 10).forEach(ligne => {
                console.log(`   "${ligne.trim()}"`);
            });
            
            // 2. Chercher "Coupon"
            const lignesAvecCoupon = lignes.filter(l => l.toLowerCase().includes('coupon'));
            console.log(`\n📍 Lignes contenant "Coupon": ${lignesAvecCoupon.length}`);
            lignesAvecCoupon.slice(0, 10).forEach(ligne => {
                console.log(`   "${ligne.trim()}"`);
            });
            
            // 3. Chercher des codes 30m1G
            const lignesAvecCodes = lignes.filter(l => l.match(/30m1G[A-Za-z0-9]/));
            console.log(`\n📍 Lignes contenant des codes 30m1G: ${lignesAvecCodes.length}`);
            lignesAvecCodes.slice(0, 10).forEach(ligne => {
                console.log(`   "${ligne.trim()}"`);
            });
            
            // 4. Chercher des numéros simples
            const lignesAvecNumeros = lignes.filter(l => l.trim().match(/^\d+$/));
            console.log(`\n📍 Lignes contenant uniquement des numéros: ${lignesAvecNumeros.length}`);
            lignesAvecNumeros.slice(0, 20).forEach(ligne => {
                console.log(`   "${ligne.trim()}"`);
            });
            
            // 5. Chercher "500Ar" ou "500" ou "Ar"
            const lignesAvec500 = lignes.filter(l => l.toLowerCase().includes('500') || l.toLowerCase().includes('ar'));
            console.log(`\n📍 Lignes contenant "500/Ar": ${lignesAvec500.length}`);
            lignesAvec500.slice(0, 10).forEach(ligne => {
                console.log(`   "${ligne.trim()}"`);
            });
            
            // 6. Afficher structure detectée
            console.log('\n📊 STRUCTURE DÉTECTÉE:');
            
            // Chercher des patterns de numérotation
            const tousLesNumeros = [];
            lignes.forEach((ligne, i) => {
                const matches = ligne.match(/\b\d+\b/g);
                if (matches) {
                    matches.forEach(match => {
                        const num = parseInt(match);
                        if (num >= 1 && num <= 321) {
                            tousLesNumeros.push({
                                numero: num,
                                ligne: i + 1,
                                contexte: ligne.trim()
                            });
                        }
                    });
                }
            });
            
            console.log(`🔢 Numéros 1-321 trouvés: ${tousLesNumeros.length}`);
            if (tousLesNumeros.length > 0) {
                console.log('📋 Échantillon:');
                tousLesNumeros.slice(0, 10).forEach(item => {
                    console.log(`   ${item.numero} (ligne ${item.ligne}): "${item.contexte}"`);
                });
            }
            
            // Chercher tous les codes
            const tousLesCodes = [];
            lignes.forEach((ligne, i) => {
                const matches = ligne.match(/30m1G[A-Za-z0-9]{4}\b/g);
                if (matches) {
                    matches.forEach(code => {
                        tousLesCodes.push({
                            code: code,
                            ligne: i + 1,
                            contexte: ligne.trim()
                        });
                    });
                }
            });
            
            console.log(`\n📱 Codes 30m1G trouvés: ${tousLesCodes.length}`);
            if (tousLesCodes.length > 0) {
                console.log('📋 Échantillon:');
                tousLesCodes.slice(0, 10).forEach(item => {
                    console.log(`   ${item.code} (ligne ${item.ligne}): "${item.contexte}"`);
                });
            }
            
        } else {
            console.log('❌ Aucun texte extrait');
        }
        
        // Nettoyage
        console.log('\n🧹 Nettoyage...');
        tempFiles.forEach(file => {
            try {
                fs.unlinkSync(path.join('./temp/', file));
            } catch (err) {}
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Lancement du debug
debugOcrExtraction()
    .then(() => {
        console.log('\n🏁 DEBUG TERMINÉ');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erreur fatale:', error.message);
        process.exit(1);
    }); 