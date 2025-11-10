import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URI = process.env.DATABASE_URI;
const productId = '690c6c6a5e6cd5658490ca2b';

if (!DATABASE_URI) {
  console.error('DATABASE_URI is not set in .env file');
  process.exit(1);
}

const checkMediaReferences = async () => {
  const client = new MongoClient(DATABASE_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const productsCollection = db.collection('products');
    const mediaCollection = db.collection('media');
    
    const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
    
    if (!product) {
      console.log('Product not found');
      return;
    }
    
    console.log(`Product: ${product.name}\n`);
    
    // Check each gallery item
    for (let i = 0; i < product.gallery.length; i++) {
      const item = product.gallery[i];
      const mediaId = item.media;
      
      console.log(`Gallery Item ${i}:`);
      console.log(`  Media ID: ${mediaId}`);
      console.log(`  Media ID Type: ${typeof mediaId}, Constructor: ${mediaId.constructor.name}`);
      
      // Try to find the media record
      let mediaRecord = null;
      
      // Try as ObjectId first
      try {
        if (mediaId instanceof ObjectId || (typeof mediaId === 'object' && mediaId._bsontype === 'ObjectId')) {
          mediaRecord = await mediaCollection.findOne({ _id: mediaId });
        } else if (typeof mediaId === 'string') {
          mediaRecord = await mediaCollection.findOne({ _id: new ObjectId(mediaId) });
        }
      } catch (error) {
        console.log(`  ❌ Error finding media: ${error.message}`);
      }
      
      if (mediaRecord) {
        console.log(`  ✅ Media found: ${mediaRecord.filename}`);
      } else {
        console.log(`  ❌ Media NOT FOUND in database!`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
};

checkMediaReferences();
