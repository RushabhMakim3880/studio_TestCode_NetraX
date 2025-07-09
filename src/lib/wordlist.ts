
type WordlistGeneratorInput = {
    fullName: string;
    role: string;
    company: string;
    notes?: string;
};

export function generateWordlistFromProfile(input: WordlistGeneratorInput): string[] {
    const { fullName, role, company, notes } = input;
    const wordlist = new Set<string>();

    const nameParts = fullName.toLowerCase().split(' ').filter(p => p);
    const companyParts = company.toLowerCase().replace(/[^a-z0-9\s]/gi, '').split(' ').filter(p => p);
    const roleParts = role.toLowerCase().split(' ').filter(p => p);
    const noteParts = notes?.toLowerCase().replace(/[^a-z0-9\s]/gi, '').split(/[\s,.;]+/).filter(p => p.length > 2) || [];

    const baseWords = [...new Set([...nameParts, ...companyParts, ...roleParts, ...noteParts])];
    
    const years = [new Date().getFullYear(), new Date().getFullYear() - 1].map(String);
    const commonNumbers = ['1', '123', '1234', '12345'];
    const specialChars = ['!', '@', '#', '$', '%', '&', '*'];

    // Add base words
    baseWords.forEach(word => {
        wordlist.add(word);
        wordlist.add(word.charAt(0).toUpperCase() + word.slice(1)); // TitleCase
    });
    
    // Combinations of base words
    for (let i = 0; i < baseWords.length; i++) {
        for (let j = 0; j < baseWords.length; j++) {
            if (i !== j) {
                wordlist.add(`${baseWords[i]}${baseWords[j]}`);
                wordlist.add(`${baseWords[i]}.${baseWords[j]}`);
                wordlist.add(`${baseWords[i]}_${baseWords[j]}`);
            }
        }
    }

    const currentPasswords = Array.from(wordlist);

    // Add suffixes
    currentPasswords.forEach(password => {
        // Add years
        years.forEach(year => {
            wordlist.add(`${password}${year}`);
            wordlist.add(`${password}${year}!`);
        });

        // Add common numbers
        commonNumbers.forEach(num => {
            wordlist.add(`${password}${num}`);
        });

        // Add special characters
        specialChars.forEach(char => {
            wordlist.add(`${password}${char}`);
        });
    });

    // Simple substitutions
    currentPasswords.forEach(password => {
        let p = password;
        p = p.replace(/a/g, '@').replace(/o/g, '0').replace(/i/g, '1').replace(/s/g, '$');
        if (p !== password) {
            wordlist.add(p);
        }
    });
    
    // Add some fully generic ones based on company
    companyParts.forEach(part => {
        wordlist.add(`${part}123`);
        wordlist.add(`${part}123!`);
        wordlist.add(`${part}@${new Date().getFullYear()}`);
    })


    const finalWordlist = Array.from(wordlist);
    
    // Shuffle and limit to a reasonable number
    for (let i = finalWordlist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalWordlist[i], finalWordlist[j]] = [finalWordlist[j], finalWordlist[i]];
    }

    return finalWordlist.slice(0, 50); // Limit to 50 for performance
}
