package com.travelcrm.shared.pdf;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

public final class PdfDocumentRenderer {
    private PdfDocumentRenderer() {}

    public static byte[] render(List<BufferedImage> pages) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            for (BufferedImage pageImage : pages) {
                PDPage page = new PDPage(PDRectangle.A4);
                document.addPage(page);

                PDImageXObject image = LosslessFactory.createFromImage(document, pageImage);
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();
                float imageWidth = pageImage.getWidth();
                float imageHeight = pageImage.getHeight();
                float scale = Math.min(pageWidth / imageWidth, pageHeight / imageHeight);
                float drawWidth = imageWidth * scale;
                float drawHeight = imageHeight * scale;
                float x = (pageWidth - drawWidth) / 2f;
                float y = (pageHeight - drawHeight) / 2f;

                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    content.drawImage(image, x, y, drawWidth, drawHeight);
                }
            }
            document.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Не удалось сформировать PDF", e);
        }
    }
}
