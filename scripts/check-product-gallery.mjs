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

const checkProductGallery = async () => {
  const client = new MongoClient(DATABASE_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const productsCollection = db.collection('products');
    
    // Convert string ID to ObjectId
    const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
    
    if (!product) {
      console.log('Product not found with ID:', productId);
      return;
    }
    
    console.log('Product Name:', product.name);
    console.log('\n=== Gallery Structure (Raw) ===');
    console.log(JSON.stringify(product.gallery, null, 2));
    
    console.log('\n=== Image Field ===');
    console.log('Image:', product.image);
    
    console.log('\n=== Cover Field ===');
    console.log('Cover:', product.cover);
    
    // Check if gallery items have the correct structure
    if (Array.isArray(product.gallery)) {
      console.log('\n=== Gallery Analysis ===');
      console.log('Gallery length:', product.gallery.length);
      
      product.gallery.forEach((item, index) => {
        console.log(`\nItem ${index}:`, JSON.stringify(item, null, 2));
        console.log('  Has media property:', 'media' in item);
        console.log('  Has id property:', 'id' in item);
        if (item.media) {
          console.log('  Media type:', typeof item.media);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
};

checkProductGallery();
