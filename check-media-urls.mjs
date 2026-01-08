import { MongoClient } from 'mongodb';

const DB_URI = "mongodb+srv://toolbay01_db_user:DbDKPVyf0Kikfhi2@toolbayproductioncluste.aq3gvoz.mongodb.net/toolboxx?retryWrites=true&w=majority&appName=ToolbayProductionCluster";

const client = new MongoClient(DB_URI);

try {
  await client.connect();
  const db = client.db();
  const media = await db.collection('media').find({}).limit(5).toArray();
  
  console.log('Sample media records:');
  media.forEach(m => {
    console.log(`\nID: ${m._id}`);
    console.log(`Filename: ${m.filename}`);
    console.log(`URL: ${m.url}`);
    console.log(`MimeType: ${m.mimeType}`);
  });
} finally {
  await client.close();
}
