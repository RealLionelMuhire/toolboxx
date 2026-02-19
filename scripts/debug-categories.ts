
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();



async function debugCategories() {
    console.log("🔍 Debugging Categories...");

    const { getPayloadSingleton } = await import("../src/lib/payload-singleton");
    const payload = await getPayloadSingleton();

    try {
        const data = await payload.find({
            collection: "categories",
            depth: 1, // Populate subcategories
            pagination: false,
            where: {
                parent: {
                    exists: false,
                },
            },
            sort: "name"
        });

        console.log(`Found ${data.docs.length} top-level categories.`);

        data.docs.forEach((doc: any) => {
            console.log(`Category: ${doc.name} (ID: ${doc.id})`);
            if (doc.subcategories) {
                if (doc.subcategories.docs) {
                    console.log(`  Subcategories (docs array): ${doc.subcategories.docs.length}`);
                    doc.subcategories.docs.forEach((sub: any) => {
                        console.log(`    - ${typeof sub === 'string' ? sub : sub.name} (${typeof sub === 'string' ? 'ID' : 'Object'})`);
                    });
                } else if (Array.isArray(doc.subcategories)) {
                    console.log(`  Subcategories (array): ${doc.subcategories.length}`);
                    doc.subcategories.forEach((sub: any) => {
                        console.log(`    - ${typeof sub === 'string' ? sub : sub.name} (${typeof sub === 'string' ? 'ID' : 'Object'})`);
                    });
                } else {
                    console.log(`  Subcategories (unknown structure):`, doc.subcategories);
                }
            } else {
                console.log(`  Subcategories: undefined/null`);
            }
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
    }

    process.exit(0);
}

debugCategories();
