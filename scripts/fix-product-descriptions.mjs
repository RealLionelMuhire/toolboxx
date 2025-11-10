/**
 * Migration Script: Fix Product Descriptions
 * 
 * This script converts plain text descriptions to Lexical editor format
 * for products that were created with string descriptions instead of the
 * proper Lexical JSON structure.
 * 
 * Run with: node scripts/fix-product-descriptions.mjs
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PAYLOAD_SECRET = process.env.PAYLOAD_SECRET;
const DATABASE_URI = process.env.DATABASE_URI;

if (!DATABASE_URI) {
  console.error('❌ DATABASE_URI is not defined in .env file');
  process.exit(1);
}

if (!PAYLOAD_SECRET) {
  console.error('❌ PAYLOAD_SECRET is not defined in .env file');
  process.exit(1);
}

/**
 * Convert plain text to Lexical format
 */
function convertTextToLexical(text) {
  if (!text || typeof text !== 'string') {
    return undefined;
  }

  // Split text by newlines to create multiple paragraphs
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  const children = lines.map(line => ({
    type: "paragraph",
    format: "",
    indent: 0,
    version: 1,
    children: [
      {
        type: "text",
        format: 0,
        text: line,
        mode: "normal",
        style: "",
        detail: 0,
        version: 1,
      },
    ],
    direction: "ltr",
  }));

  // If no valid lines, create empty paragraph
  if (children.length === 0) {
    children.push({
      type: "paragraph",
      format: "",
      indent: 0,
      version: 1,
      children: [],
      direction: "ltr",
    });
  }

  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      children,
      direction: "ltr",
    },
  };
}

async function main() {
  console.log('🔧 Starting Product Description Migration...\n');

  let mongooseConnection;
  
  try {
    // Dynamic import of mongoose
    const mongoose = await import('mongoose');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    mongooseConnection = await mongoose.default.connect(DATABASE_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get the products collection
    const db = mongoose.default.connection.db;
    const productsCollection = db.collection('products');

    // Find all products
    const products = await productsCollection.find({}).toArray();
    console.log(`📦 Found ${products.length} total products\n`);

    let fixedCount = 0;
    let alreadyValidCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const productName = product.name || 'Unnamed Product';
      
      // Check if description needs fixing
      if (!product.description) {
        console.log(`⏭️  [${product._id}] ${productName} - No description, skipping`);
        skippedCount++;
        continue;
      }

      // If description is already in Lexical format (object with root), skip
      if (typeof product.description === 'object' && product.description.root) {
        console.log(`✓  [${product._id}] ${productName} - Already valid Lexical format`);
        alreadyValidCount++;
        continue;
      }

      // If description is a plain string, convert it
      if (typeof product.description === 'string') {
        console.log(`🔄 [${product._id}] ${productName} - Converting string to Lexical format`);
        
        const lexicalDescription = convertTextToLexical(product.description);
        
        // Update the product
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { description: lexicalDescription } }
        );
        
        console.log(`✅ [${product._id}] ${productName} - Fixed!`);
        fixedCount++;
        continue;
      }

      // Unknown format
      console.log(`⚠️  [${product._id}] ${productName} - Unknown description format:`, typeof product.description);
      skippedCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Fixed: ${fixedCount} products`);
    console.log(`✓  Already Valid: ${alreadyValidCount} products`);
    console.log(`⏭️  Skipped: ${skippedCount} products`);
    console.log(`📦 Total: ${products.length} products`);
    console.log('='.repeat(50));

    if (fixedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('   You can now view these products in Payload CMS without errors.');
    } else if (alreadyValidCount === products.length - skippedCount) {
      console.log('\n✨ All products already have valid descriptions!');
    } else {
      console.log('\n⚠️  Some products could not be fixed. Check the logs above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (mongooseConnection) {
      await mongooseConnection.disconnect();
      console.log('\n📡 Disconnected from MongoDB');
    }
  }
}

// Run the migration
main().catch(console.error);
