import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URI = process.env.DATABASE_URI;

if (!DATABASE_URI) {
  console.error('DATABASE_URI is not set in .env file');
  process.exit(1);
}

const fixGalleryObjectIds = async () => {
  const client = new MongoClient(DATABASE_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const productsCollection = db.collection('products');
    
    // Find all products with gallery
    const products = await productsCollection.find({ gallery: { $exists: true, $ne: [] } }).toArray();
    
    console.log(`\nFound ${products.length} products with galleries\n`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        let needsUpdate = false;
        const fixedGallery = product.gallery.map(item => {
          // Check if media is a string (needs fixing)
          if (item.media && typeof item.media === 'string') {
            console.log(`Product "${product.name}": Converting gallery media from string to ObjectId`);
            needsUpdate = true;
            return {
              ...item,
              media: new ObjectId(item.media)
            };
          }
          return item;
        });
        
        if (needsUpdate) {
          await productsCollection.updateOne(
            { _id: product._id },
            { $set: { gallery: fixedGallery } }
          );
          console.log(`✅ Fixed product: ${product.name} (ID: ${product._id})`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ Error fixing product ${product.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total products: ${products.length}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`No changes needed: ${products.length - fixedCount - errorCount}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
};

fixGalleryObjectIds();
