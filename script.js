// Common words to ignore when extracting keywords
const stopWords = new Set(['the', 'and', 'was', 'for', 'that', 'with', 'from', 'this', 'into', 'rocket', 'mars', 'about', 'launching', 'news', 'post', 'social', 'media']);

async function processText() {
    const text = document.getElementById('input-text').value;
    const tld = document.getElementById('tld-select').value;
    const grid = document.getElementById('results-grid');
    const status = document.getElementById('status-msg');

    if (!text.trim()) {
        alert("Please paste some text first.");
        return;
    }

    status.innerText = "Analyzing keywords...";
    grid.innerHTML = '<div class="empty-state">Analyzing and checking availability...</div>';

    // 1. Extract Keywords
    let words = text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w)); // Filter words

    // Get unique keywords
    let uniqueWords = [...new Set(words)];
    
    // 2. Generate combinations
    let potentialDomains = [];
    for (let i = 0; i < uniqueWords.length; i++) {
        for (let j = 0; j < uniqueWords.length; j++) {
            if (i !== j) {
                potentialDomains.push(uniqueWords[i] + uniqueWords[j] + tld);
            }
        }
    }

    // Limit to top 15 results to prevent rate limiting
    const domainsToCheck = potentialDomains.slice(0, 15);
    
    grid.innerHTML = '';
    let found = 0;

    // 3. Check Availability via RDAP
    for (let domain of domainsToCheck) {
        status.innerText = `Checking ${domain}...`;
        const isAvailable = await checkDomainAvailability(domain);
        
        if (isAvailable) {
            found++;
            addDomainToGrid(domain);
        }
    }

    status.innerText = `Finished. Found ${found} available domains.`;
    if (found === 0) {
        grid.innerHTML = '<div class="empty-state">No available domains found in the first 15 combinations. Try different text.</div>';
    }
}

/**
 * RDAP Check: Public and Free.
 * If the API returns a 404, the domain is likely available.
 */
async function checkDomainAvailability(domain) {
    try {
        // We use a CORS proxy because RDAP servers usually don't allow direct browser requests
        const proxy = "https://corsproxy.io/?";
        const response = await fetch(`${proxy}https://rdap.org/domain/${domain}`);
        
        // In RDAP, a 404 status code means the domain is not found (Available)
        return response.status === 404;
    } catch (error) {
        console.error("Error checking " + domain, error);
        return false;
    }
}

function addDomainToGrid(domain) {
    const grid = document.getElementById('results-grid');
    const card = document.createElement('div');
    card.className = 'domain-card';
    
    // Namecheap referral/search link
    const buyUrl = `https://www.namecheap.com/domains/registration/results/?domain=${domain}`;
    
    card.innerHTML = `
        <div>
            <div class="domain-name">${domain}</div>
            <div class="status-available">Available</div>
        </div>
        <a href="${buyUrl}" target="_blank" class="buy-link">Register</a>
    `;
    grid.appendChild(card);
}
