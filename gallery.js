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
    console.log(`Loading feature data from: ${jsonPath}`);
    const response = await fetch(jsonPath);
    const featureData = await response.json();
    console.log(`Loaded feature data for ${featureId}:`, featureData);
    
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
    
    // Populate text content with first image description
    console.log(`Initializing ${featureId} with description:`, images[0].description);
    elements.textContainer.innerHTML = `
      <h2>${featureData.title}</h2>
      <p>${images[0].description}</p>
    `;
    
    // Set initial image
    elements.mainImg.src = images[0].src;
    elements.mainImg.alt = images[0].alt;
    elements.mainLink.href = images[0].src;
    
    // Add click handler for custom lightbox
    elements.mainLink.addEventListener('click', (e) => {
      e.preventDefault();
      console.log(`Opening lightbox for ${featureId} with ${images.length} images`);
      openFeatureLightbox(featureId, images, 0);
    });
    
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
    
    // Remove GLightbox class from main link
    elements.mainLink.classList.remove('glightbox');
    
    // Update feature function
    function updateFeature(idx) {
      featureIndex = idx;
      elements.mainImg.src = images[featureIndex].src;
      elements.mainImg.alt = images[featureIndex].alt;
      elements.mainLink.href = images[featureIndex].src;
      
      // Update description text
      const descriptionElement = elements.textContainer.querySelector('p');
      if (descriptionElement) {
        console.log(`Updating ${featureId} description to:`, images[featureIndex].description);
        descriptionElement.textContent = images[featureIndex].description;
      }
      
      // Update dots
      const dots = elements.dotsContainer.querySelectorAll('.feature-dot');
      dots.forEach((d, i) => d.classList.toggle('selected', i === featureIndex));
    }
    
    // Add click handlers to dots for lightbox
    elements.dotsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('feature-dot')) {
        const index = parseInt(e.target.getAttribute('data-index'));
        openFeatureLightbox(featureId, images, index);
      }
    });
    
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
  
  // Initialize GLightbox (excluding features)
  GLightbox({ 
    selector: ".glightbox:not(.featured-image-link)" 
  });
  
  // Initialize all features
  await initializeAllFeatures();
  
  // Re-initialize GLightbox for dynamically added elements (excluding features)
  GLightbox({ 
    selector: ".glightbox:not(.featured-image-link)" 
  });
}

// Custom Feature Lightbox
function openFeatureLightbox(featureId, images, startIndex) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'feature-lightbox-overlay';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  `;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'feature-lightbox-content';
  modalContent.style.cssText = `
    background: white;
    border-radius: 8px;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  `;
  
  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.style.cssText = `
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    position: relative;
  `;
  
  // Create image
  const image = document.createElement('img');
  image.style.cssText = `
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  `;
  
  // Create description panel
  const descriptionPanel = document.createElement('div');
  descriptionPanel.style.cssText = `
    width: 300px;
    padding: 30px;
    background: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  `;
  
  // Create description content
  const descriptionContent = document.createElement('div');
  descriptionContent.innerHTML = `
    <h3 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">${featureId.charAt(0).toUpperCase() + featureId.slice(1)} Collection</h3>
    <p style="margin: 0; line-height: 1.6; color: #666; font-size: 16px;">${images[startIndex].description}</p>
  `;
  
  // Create navigation
  const navigation = document.createElement('div');
  navigation.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 30px;
  `;
  
  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '‹ Previous';
  prevBtn.style.cssText = `
    background: #333;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `;
  
  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = 'Next ›';
  nextBtn.style.cssText = `
    background: #333;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Assemble modal
  imageContainer.appendChild(image);
  imageContainer.appendChild(closeBtn);
  navigation.appendChild(prevBtn);
  navigation.appendChild(nextBtn);
  descriptionPanel.appendChild(descriptionContent);
  descriptionPanel.appendChild(navigation);
  modalContent.appendChild(imageContainer);
  modalContent.appendChild(descriptionPanel);
  modal.appendChild(modalContent);
  
  // Add to page
  document.body.appendChild(modal);
  
  // Set initial image
  let currentIndex = startIndex;
  image.src = images[currentIndex].src;
  image.alt = images[currentIndex].alt;
  
  // Update description function
  function updateLightboxImage(index) {
    currentIndex = index;
    image.src = images[currentIndex].src;
    image.alt = images[currentIndex].alt;
    descriptionContent.querySelector('p').textContent = images[currentIndex].description;
    
    // Update button states
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === images.length - 1;
    prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
    nextBtn.style.opacity = currentIndex === images.length - 1 ? '0.5' : '1';
  }
  
  // Event listeners
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      updateLightboxImage(currentIndex - 1);
    }
  });
  
  nextBtn.addEventListener('click', () => {
    if (currentIndex < images.length - 1) {
      updateLightboxImage(currentIndex + 1);
    }
  });
  
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', function handleKeydown(e) {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
      document.removeEventListener('keydown', handleKeydown);
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      updateLightboxImage(currentIndex - 1);
    } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
      updateLightboxImage(currentIndex + 1);
    }
  });
  
  // Set initial button states
  updateLightboxImage(currentIndex);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initializeGallery); 