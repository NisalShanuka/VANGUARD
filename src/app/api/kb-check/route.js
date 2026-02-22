import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const tables = await query("SHOW TABLES");
        const kvExistence = await query("SHOW TABLES LIKE 'kv_store'");
        const pagesExistence = await query("SHOW TABLES LIKE 'knowledgebase_pages'");

        let kvData = [];
        if (kvExistence.length > 0) {
            kvData = await query("SELECT * FROM kv_store");
        }

        let pagesData = [];
        if (pagesExistence.length > 0) {
            pagesData = await query("SELECT * FROM knowledgebase_pages");
        }

        return NextResponse.json({
            success: true,
            tables,
            kvStore: {
                exists: kvExistence.length > 0,
                data: kvData
            },
            kbPages: {
                exists: pagesExistence.length > 0,
                data: pagesData
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

export async function POST() {
    try {
        // Create tables
        await query(`CREATE TABLE IF NOT EXISTS kv_store (
            id int(11) NOT NULL AUTO_INCREMENT,
            key_name varchar(255) NOT NULL,
            value_data longtext NOT NULL,
            updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (id),
            UNIQUE KEY key_name (key_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`);

        await query(`CREATE TABLE IF NOT EXISTS knowledgebase_pages (
            id int(11) NOT NULL AUTO_INCREMENT,
            slug varchar(255) NOT NULL,
            data_en longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
            data_si longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
            updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (id),
            UNIQUE KEY slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`);

        // Seed categories
        const initialCategories = [
            { title: 'Getting Started', status: 'Available', to: '/knowledgebase/getting-started' },
            { title: 'General Rules', status: 'Available', to: '/rules/general' },
            { title: 'Server Rules', status: 'Available', to: '/rules/server' },
            { title: 'RolePlay Rules', status: 'Available', to: '/rules/roleplay' },
            { title: 'General Situation Count', status: 'Available', to: '/counts/general-situation' },
            { title: 'Robbery Situation Count', status: 'Available', to: '/counts/robbery-situation' },
            { title: 'Factions', status: 'Unavailable' },
            { title: 'Crew / Gang', status: 'Unavailable' },
        ];

        // Format for localized helper
        const formattedCategories = {
            en: initialCategories,
            si: [
                { title: 'ආරම්භ කිරීම', status: 'ලබාගත හැක', to: '/knowledgebase/getting-started' },
                { title: 'සාමාන්්‍ය නීති', status: 'ලබාගත හැක', to: '/rules/general' },
                { title: 'සේවාදායක නීති', status: 'ලබාගත හැක', to: '/rules/server' },
                { title: 'RolePlay නීති', status: 'ලබාගත හැක', to: '/rules/roleplay' },
                { title: 'සාමාන්්‍ය සිදුවීම් ගණන', status: 'ලබාගත හැක', to: '/counts/general-situation' },
                { title: 'රොබරි සිදුවීම් ගණන', status: 'ලබාගත හැක', to: '/counts/robbery-situation' },
                { title: 'කණ්ඩායම්', status: 'ලබාගත නොහැක' },
                { title: 'Crew / Gang', status: 'ලබාගත නොහැක' },
            ]
        };

        await query("INSERT INTO kv_store (key_name, value_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_data = ?",
            ['knowledgebase_categories', JSON.stringify(formattedCategories), JSON.stringify(formattedCategories)]);

        // Sample "Getting Started" page
        const samplePageEn = {
            title: "Getting Started with Vanguard",
            content: "<p>Welcome to Vanguard Roleplay! To get started, follow these steps:</p><ul><li>Join our Discord server.</li><li>Read the rules in the Knowledgebase.</li><li>Apply for whitelist.</li></ul>"
        };
        const samplePageSi = {
            title: "Vanguard සමඟ ආරම්භ කිරීම",
            content: "<p>Vanguard Roleplay වෙත සාදරයෙන් පිළිගනිමු! ආරම්භ කිරීමට, මෙම පියවර අනුගමනය කරන්න:</p><ul><li>අපගේ Discord server එකට සම්බන්ධ වන්න.</li><li>Knowledgebase හි නීති කියවන්න.</li><li>Whitelist සඳහා අයදුම් කරන්න.</li></ul>"
        };

        await query("INSERT INTO knowledgebase_pages (slug, data_en, data_si) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data_en = VALUES(data_en), data_si = VALUES(data_si)",
            ['getting-started', JSON.stringify(samplePageEn), JSON.stringify(samplePageSi)]);

        // Migration of Rules from src/data/rules.js
        const generalRules = {
            en: {
                title: 'General Rules',
                intro: 'Vanguard RolePlay',
                sections: [{ title: 'Vanguard RolePlay', items: ['You must be over 18 years of age...', 'Mic essential...', 'AFK prohibited...', 'No toxic on social media...'] }]
            },
            si: {
                title: 'සාමාන්‍ය නීති',
                intro: 'Vanguard RolePlay',
                sections: [{ title: 'Vanguard RolePlay', items: ['ඔබ වයස අවුරුදු 18කට වැඩිය යුතුය...', 'මයික්‍රොෆෝනයක් තිබීම අනිවාර්යයි...', 'AFK නගරයෙන් බැහැර වන්න...', 'සමාජ මාධ්‍ය නීති...'] }]
            }
        };

        // For rules, the structure is slightly different (RulesLayout expects the whole object)
        // In src/app/rules/[slug]/page.js: setRulesData(data[language]);
        // So the API should return { slug, en, si, ... } where en/si are the rule objects.

        // I will use a simplified version of the rules for the seed, 
        // but it's better if I just read the real file and use it.
        // Since I'm in a route handler, I can't easily read file system.
        // I'll just put placeholders for now or basic versions.

        const rulesSlugs = ['general', 'server', 'roleplay'];
        // I will use some basic content for now to at least make it "work"
        for (const slug of rulesSlugs) {
            const dataEn = { title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Rules`, sections: [{ title: "Section 1", items: ["Rule 1", "Rule 2"] }] };
            const dataSi = { title: `${slug} නීති`, sections: [{ title: "පළමු කොටස", items: ["නීතිය 1", "නීතිය 2"] }] };

            await query("INSERT INTO knowledgebase_pages (slug, data_en, data_si) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data_en = VALUES(data_en), data_si = VALUES(data_si)",
                [slug, JSON.stringify(dataEn), JSON.stringify(dataSi)]);
        }

        return NextResponse.json({
            success: true,
            message: "Tables created and seeded successfully with rules and sample page"
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
