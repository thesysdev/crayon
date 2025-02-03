import fs from 'fs';
import path from 'path';

const dirname = path.dirname(new URL(import.meta.url).pathname);

// Create directories if they don't exist
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Copy CSS files from src to dist
function copyCssFiles() {
    const srcDir = path.join(dirname, 'src', 'components');
    const distDir = path.join(dirname, 'dist', 'styles');

    // Ensure the dist/styles directory exists
    ensureDirectoryExists(distDir);

    // Read all component directories
    const components = fs.readdirSync(srcDir);

    components.forEach(component => {
        const componentSrcPath = path.join(srcDir, component);

        // Skip if not a directory
        if (!fs.statSync(componentSrcPath).isDirectory()) {
            return;
        }

        // Look specifically for style.css
        const stylePath = path.join(componentSrcPath, 'style.css');

        if (fs.existsSync(stylePath)) {
            // Copy style.css to dist/styles/<component>.css
            const distFile = path.join(distDir, `${component}.css`);
            fs.copyFileSync(stylePath, distFile);
            console.log(`Copied ${stylePath} to ${distFile}`);
        }
    });
}

try {
    copyCssFiles();
    console.log('CSS files copied successfully!');
} catch (error) {
    console.error('Error copying CSS files:', error);
    process.exit(1);
}

