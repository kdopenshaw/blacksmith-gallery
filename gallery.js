// Configuration
const CONFIG = {
  repoOwner: "kdopenshaw",
  repoName: "blacksmith-gallery",
  folderPath: "images",
  branch: "main",
  features: [
    { id: 'sword', path: 'features/sword', container: 'sword-feature-container' },
    { id: 'axe', path: 'features/axe', container: 'axe-feature-container' }
  ],
  photosPerGallery: 6
};

// Main Gallery Loader - Split into sections
async function loadMainGallery() {
  try {
    const response = await fetch(
      `https://corsproxy.io/?https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.folderPath}`
    );
    const data = await response.json();
    
    const imageFiles = data
      .filter(file => file.type === "file" && file.name.match(/\.(jpg|jpeg|png|gif)$/i))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically for consistent ordering
    
    // Split images into gallery sections
    const gallerySections = [];
    for (let i = 0; i < imageFiles.length; i += CONFIG.photosPerGallery) {
      gallerySections.push(imageFiles.slice(i, i + CONFIG.photosPerGallery));
    }
    
    // Load each gallery section
    gallerySections.forEach((section, index) => {
      const galleryContainer = document.getElementById(`gallery-${index + 1}`);
      if (!galleryContainer) return;
      
      section.forEach(file => {
        const link = document.createElement("a");
        const imageUrl = `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/${CONFIG.branch}/${CONFIG.folderPath}/${file.name}`;
        
        link.href = imageUrl;
        link.className = "glightbox";
        link.setAttribute("data-gallery", "blacksmith");

        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = file.name;
        img.loading = "lazy";
        img.style.transition = "transform 0.2s ease";
        img.onmouseover = () => (img.style.transform = "scale(1.02)");
        img.onmouseout = () => (img.style.transform = "scale(1.0)");

        link.appendChild(img);
        galleryContainer.appendChild(link);
      });
    });
  } catch (error) {
    console.error("Failed to load main gallery:", error);
  }
}

// Feature Loader - Load into specific containers
async function loadFeatures() {
  for (const feature of CONFIG.features) {
    try {
      const container = document.getElementById(feature.container);
      if (!container) {
        console.error(`Container not found: ${feature.container}`);
        continue;
      }
      
      const response = await fetch(`${feature.path}/feature.html`);
      const html = await response.text();
      container.innerHTML = html;
    } catch (error) {
      console.error(`Failed to load feature ${feature.id}:`, error);
    }
  }
}

// Individual Feature Initializer
async function initializeFeature(featureId, jsonPath) {
  try {
    const response = await fetch(jsonPath);
    const featureData = await response.json();
    
    const elements = {
      mainImg: document.getElementById(`${featureId}-main-img`),
      mainLink: document.getElementById(`${featureId}-main-link`),
      prevBtn: document.getElementById(`${featureId}-prev`),
      nextBtn: document.getElementById(`${featureId}-next`),
      dotsContainer: document.getElementById(`${featureId}-dots`),
      textContainer: document.getElementById(`${featureId}-text`)
    };
    
    // Check if all elements exist
    if (Object.values(elements).some(el => !el)) {
      console.error(`Missing elements for feature: ${featureId}`);
      return;
    }
    
    let featureIndex = 0;
    const images = featureData.images;
    
    // Populate text content
    elements.textContainer.innerHTML = `
      <h2>${featureData.title}</h2>
      <p>${featureData.description}</p>
    `;
    
    // Set initial image
    elements.mainImg.src = images[0].src;
    elements.mainImg.alt = images[0].alt;
    elements.mainLink.href = images[0].src;
    
    // Generate dots
    elements.dotsContainer.innerHTML = '';
    images.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = `feature-dot ${index === 0 ? 'selected' : ''}`;
      dot.setAttribute('data-index', index);
      dot.setAttribute('aria-label', `Show image ${index + 1}`);
      dot.addEventListener('click', () => updateFeature(index));
      elements.dotsContainer.appendChild(dot);
    });
    
    // Add hidden lightbox links
    images.slice(1).forEach(image => {
      const hiddenLink = document.createElement('a');
      hiddenLink.href = image.src;
      hiddenLink.className = 'glightbox';
      hiddenLink.setAttribute('data-gallery', `feature-${featureId}`);
      hiddenLink.style.display = 'none';
      elements.mainLink.parentNode.appendChild(hiddenLink);
    });
    
    // Update feature function
    function updateFeature(idx) {
      featureIndex = idx;
      elements.mainImg.src = images[featureIndex].src;
      elements.mainImg.alt = images[featureIndex].alt;
      elements.mainLink.href = images[featureIndex].src;
      
      // Update dots
      const dots = elements.dotsContainer.querySelectorAll('.feature-dot');
      dots.forEach((d, i) => d.classList.toggle('selected', i === featureIndex));
    }
    
    // Navigation event listeners
    elements.prevBtn.addEventListener('click', () => {
      updateFeature((featureIndex - 1 + images.length) % images.length);
    });
    
    elements.nextBtn.addEventListener('click', () => {
      updateFeature((featureIndex + 1) % images.length);
    });
    
  } catch (error) {
    console.error(`Failed to initialize feature ${featureId}:`, error);
  }
}

// Initialize all features
async function initializeAllFeatures() {
  for (const feature of CONFIG.features) {
    await initializeFeature(feature.id, `${feature.path}/images.json`);
  }
}

// Main initialization
async function initializeGallery() {
  await Promise.all([
    loadMainGallery(),
    loadFeatures()
  ]);
  
  // Initialize GLightbox
  GLightbox({ selector: ".glightbox" });
  
  // Initialize all features
  await initializeAllFeatures();
  
  // Re-initialize GLightbox for dynamically added elements
  GLightbox({ selector: ".glightbox" });
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initializeGallery); 