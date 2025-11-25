import React, { useState, useEffect } from 'react';
import '../../styles/AdminCompact.css';

/**
 * UI Template Page - Central design system editor for the admin UI
 * Left panel: Controls for editing design system
 * Right panel: Live preview showing all UI components
 */
const UITemplate = () => {
  const [theme, setTheme] = useState({
    // Typography
    titleSize: '1.8rem',
    subtitleSize: '0.8rem',
    bodySize: '0.75rem',
    titleColor: '#34e0ff',
    subtitleColor: '#7ab8c4',
    bodyColor: '#cfd8df',
    
    // Backgrounds
    pageBg: 'transparent',
    containerBg: 'rgba(0, 255, 255, 0.1)',
    cardBg: 'rgba(0, 10, 20, 0.6)',
    gradientStart: 'rgba(0,255,255,0.12)',
    gradientEnd: 'rgba(0,255,255,0.02)',
    gradientAngle: 180,
    
    // Borders
    borderColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: '4px',
    borderWidth: '1px',
    
    // Buttons
    buttonBg: 'rgba(52, 224, 255, 0.15)',
    buttonHover: 'rgba(52, 224, 255, 0.25)',
    buttonText: '#34e0ff',
    buttonBorder: 'rgba(52, 224, 255, 0.4)',
    
    // Messages
    successBg: 'rgba(0, 255, 136, 0.1)',
    successBorder: 'rgba(0, 255, 136, 0.5)',
    successText: '#00ff88',
    warningBg: 'rgba(255, 193, 7, 0.1)',
    warningBorder: 'rgba(255, 193, 7, 0.5)',
    warningText: '#ffc107',
    errorBg: 'rgba(255, 0, 0, 0.1)',
    errorBorder: 'rgba(255, 107, 107, 0.5)',
    errorText: '#ff6b6b',
    
    // Table
    tableHeaderBg: 'rgba(0, 40, 60, 0.6)',
    tableRowBg: 'transparent',
    tableRowHover: 'rgba(52, 224, 255, 0.05)',
    tableBorder: 'rgba(52, 224, 255, 0.2)',
    
    // Code & Badges
    codeBg: 'rgba(0, 255, 136, 0.1)',
    codeText: '#00ff88',
    codeBorder: 'rgba(0, 255, 136, 0.3)',
    badgeBg: 'rgba(0, 204, 255, 0.15)',
    badgeText: '#00ccff',
    badgeBorder: 'rgba(0, 204, 255, 0.4)',
    
    // Tags (smaller than badges)
    tagBg: 'rgba(255, 193, 7, 0.1)',
    tagText: '#ffc107',
    tagBorder: 'rgba(255, 193, 7, 0.5)',
    
    // Value Highlight
    valueHighlightBg: 'rgba(0, 204, 255, 0.15)',
    valueHighlightText: '#34e0ff',
    valueHighlightBorder: '#34e0ff',
    valueHighlightAccent: '#34e0ff',
    
    // Info Banner
    infoBg: 'rgba(255, 170, 0, 0.1)',
    infoBorder: 'rgba(255, 170, 0, 0.5)',
    infoText: '#ffaa00',
    
    // Category/Section Headers
    categoryBg: 'rgba(52, 224, 255, 0.15)',
    categoryBorder: '#34e0ff',
    categoryText: '#34e0ff',
  });

  const updateTheme = (key, value) => setTheme(t => ({ ...t, [key]: value }));

  // Sync theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Typography
    root.style.setProperty('--theme-title-size', theme.titleSize);
    root.style.setProperty('--theme-subtitle-size', theme.subtitleSize);
    root.style.setProperty('--theme-body-size', theme.bodySize);
    root.style.setProperty('--theme-title-color', theme.titleColor);
    root.style.setProperty('--theme-subtitle-color', theme.subtitleColor);
    root.style.setProperty('--theme-body-color', theme.bodyColor);
    
    // Backgrounds
    root.style.setProperty('--theme-page-bg', theme.pageBg);
    root.style.setProperty('--theme-container-bg', theme.containerBg);
    root.style.setProperty('--theme-card-bg', theme.cardBg);
    root.style.setProperty('--theme-gradient-start', theme.gradientStart);
    root.style.setProperty('--theme-gradient-end', theme.gradientEnd);
    root.style.setProperty('--theme-gradient-angle', `${theme.gradientAngle}deg`);
    
    // Borders
    root.style.setProperty('--theme-border-color', theme.borderColor);
    root.style.setProperty('--theme-border-radius', theme.borderRadius);
    root.style.setProperty('--theme-border-width', theme.borderWidth);
    
    // Buttons
    root.style.setProperty('--theme-button-bg', theme.buttonBg);
    root.style.setProperty('--theme-button-hover', theme.buttonHover);
    root.style.setProperty('--theme-button-text', theme.buttonText);
    root.style.setProperty('--theme-button-border', theme.buttonBorder);
    
    // Messages
    root.style.setProperty('--theme-success-bg', theme.successBg);
    root.style.setProperty('--theme-success-border', theme.successBorder);
    root.style.setProperty('--theme-success-text', theme.successText);
    root.style.setProperty('--theme-warning-bg', theme.warningBg);
    root.style.setProperty('--theme-warning-border', theme.warningBorder);
    root.style.setProperty('--theme-warning-text', theme.warningText);
    root.style.setProperty('--theme-error-bg', theme.errorBg);
    root.style.setProperty('--theme-error-border', theme.errorBorder);
    root.style.setProperty('--theme-error-text', theme.errorText);
    
    // Table
    root.style.setProperty('--theme-table-header-bg', theme.tableHeaderBg);
    root.style.setProperty('--theme-table-row-bg', theme.tableRowBg);
    root.style.setProperty('--theme-table-row-hover', theme.tableRowHover);
    root.style.setProperty('--theme-table-border', theme.tableBorder);
    
    // Code & Badges
    root.style.setProperty('--theme-code-bg', theme.codeBg);
    root.style.setProperty('--theme-code-text', theme.codeText);
    root.style.setProperty('--theme-code-border', theme.codeBorder);
    root.style.setProperty('--theme-badge-bg', theme.badgeBg);
    root.style.setProperty('--theme-badge-text', theme.badgeText);
    root.style.setProperty('--theme-badge-border', theme.badgeBorder);
    
    // Tags
    root.style.setProperty('--theme-tag-bg', theme.tagBg);
    root.style.setProperty('--theme-tag-text', theme.tagText);
    root.style.setProperty('--theme-tag-border', theme.tagBorder);
    
    // Value Highlight
    root.style.setProperty('--theme-value-highlight-bg', theme.valueHighlightBg);
    root.style.setProperty('--theme-value-highlight-text', theme.valueHighlightText);
    root.style.setProperty('--theme-value-highlight-border', theme.valueHighlightBorder);
    root.style.setProperty('--theme-value-highlight-accent', theme.valueHighlightAccent);
    
    // Info Banner
    root.style.setProperty('--theme-info-bg', theme.infoBg);
    root.style.setProperty('--theme-info-border', theme.infoBorder);
    root.style.setProperty('--theme-info-text', theme.infoText);
    
    // Category Headers
    root.style.setProperty('--theme-category-bg', theme.categoryBg);
    root.style.setProperty('--theme-category-border', theme.categoryBorder);
    root.style.setProperty('--theme-category-text', theme.categoryText);
  }, [theme]);

  return (
    <div className="digital-grid-bg" style={{ minHeight: '100vh', padding: '1rem' }}>
      
      <h2 style={{ color: theme.titleColor, fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 600, textAlign: 'center' }}>
        UI Design System
      </h2>
      
      {/* Typography Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '25% 75%', 
        gap: '1rem', 
        marginBottom: '1rem',
        background: `linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
        border: `${theme.borderWidth} solid ${theme.borderColor}`,
        borderRadius: theme.borderRadius,
        padding: '1rem'
      }}>
        {/* Controls */}
        <div>
          <h4 style={{ color: theme.titleColor, fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Typography</h4>
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Title Size</label>
          <input type="range" min="1" max="3" step="0.1" value={parseFloat(theme.titleSize)} 
            onChange={e => updateTheme('titleSize', `${e.target.value}rem`)} 
            style={{ width: '100%', marginBottom: '0.75rem' }} />
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Title Color</label>
          <input type="color" value={theme.titleColor} onChange={e => updateTheme('titleColor', e.target.value)} 
            style={{ width: '100%', marginBottom: '0.75rem', height: '30px' }} />
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Subtitle Color</label>
          <input type="color" value={theme.subtitleColor} onChange={e => updateTheme('subtitleColor', e.target.value)} 
            style={{ width: '100%', marginBottom: '0.75rem', height: '30px' }} />
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Body Color</label>
          <input type="color" value={theme.bodyColor} onChange={e => updateTheme('bodyColor', e.target.value)} 
            style={{ width: '100%', height: '30px' }} />
        </div>
        
        {/* Preview */}
        <div style={{ paddingRight: '1rem' }}>
          <h1 style={{ 
            color: theme.titleColor, 
            fontSize: theme.titleSize, 
            margin: '0 0 0.5rem 0',
            fontWeight: 600
          }}>
            Main Page Title
          </h1>
          <h3 style={{ color: theme.subtitleColor, fontSize: theme.subtitleSize, margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Section Subtitle
          </h3>
          <p style={{ color: theme.bodyColor, fontSize: theme.bodySize, margin: 0, lineHeight: '1.5' }}>
            This is body text that appears in most of the UI. It should be readable and comfortable for extended viewing.
          </p>
        </div>
      </div>

      {/* Backgrounds & Gradients Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '25% 75%', 
        gap: '1rem', 
        marginBottom: '1rem',
        background: `linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
        border: `${theme.borderWidth} solid ${theme.borderColor}`,
        borderRadius: theme.borderRadius,
        padding: '1rem'
      }}>
        {/* Controls */}
        <div>
          <h4 style={{ color: theme.titleColor, fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Backgrounds</h4>
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Container Bg</label>
          <input type="text" value={theme.containerBg} onChange={e => updateTheme('containerBg', e.target.value)} 
            style={{ width: '100%', marginBottom: '0.75rem', padding: '0.4rem 0.6rem', background: 'rgba(0,10,20,0.8)', border: `1px solid rgba(52,224,255,0.3)`, borderRadius: '4px', color: theme.bodyColor, fontSize: theme.bodySize }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Gradient Start</label>
              <input type="color" value={theme.gradientStart} onChange={e => updateTheme('gradientStart', e.target.value)} style={{ width: '100%', height: '30px' }} />
            </div>
            <div>
              <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Gradient End</label>
              <input type="color" value={theme.gradientEnd} onChange={e => updateTheme('gradientEnd', e.target.value)} style={{ width: '100%', height: '30px' }} />
            </div>
          </div>
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Gradient Angle ({theme.gradientAngle}Â°)</label>
          <input type="range" min="0" max="360" step="5" value={theme.gradientAngle} onChange={e => updateTheme('gradientAngle', parseInt(e.target.value,10))} style={{ width: '100%' }} />
        </div>
        
        {/* Preview */}
        <div style={{ paddingRight: '1rem' }}>
          <div style={{
            background: `linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
            border: `${theme.borderWidth} solid ${theme.borderColor}`,
            borderRadius: theme.borderRadius,
            padding: '1rem',
            marginBottom: '0.75rem'
          }}>
            <h4 style={{ color: theme.titleColor, fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 600 }}>Container with Gradient</h4>
            <p style={{ color: theme.bodyColor, fontSize: theme.bodySize, margin: 0 }}>
              This container uses the gradient background. Adjust the angle and colors to see changes.
            </p>
          </div>
          <div style={{
            background: theme.containerBg,
            border: `${theme.borderWidth} solid ${theme.borderColor}`,
            borderRadius: theme.borderRadius,
            padding: '1rem'
          }}>
            <h4 style={{ color: theme.titleColor, fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 600 }}>Solid Container Background</h4>
            <p style={{ color: theme.bodyColor, fontSize: theme.bodySize, margin: 0 }}>
              This uses the container background color (typically semi-transparent).
            </p>
          </div>
        </div>
      </div>

      {/* Borders Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '25% 75%', 
        gap: '1rem', 
        marginBottom: '1rem',
        background: `linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
        border: `${theme.borderWidth} solid ${theme.borderColor}`,
        borderRadius: theme.borderRadius,
        padding: '1rem'
      }}>
        {/* Controls */}
        <div>
          <h4 style={{ color: theme.titleColor, fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Borders</h4>
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Border Color</label>
          <input type="color" value={theme.borderColor} onChange={e => updateTheme('borderColor', e.target.value)} 
            style={{ width: '100%', marginBottom: '0.75rem', height: '30px' }} />
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Border Radius ({parseFloat(theme.borderRadius)}px)</label>
          <input type="range" min="0" max="20" step="1" value={parseFloat(theme.borderRadius)} 
            onChange={e => updateTheme('borderRadius', `${e.target.value}px`)} 
            style={{ width: '100%' }} />
        </div>
        
        {/* Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{
            background: theme.containerBg,
            border: `${theme.borderWidth} solid ${theme.borderColor}`,
            borderRadius: theme.borderRadius,
            padding: '1rem'
          }}>
            <p style={{ color: theme.bodyColor, fontSize: theme.bodySize, margin: 0 }}>Border preview</p>
          </div>
          <div style={{
            background: theme.containerBg,
            border: `3px solid ${theme.borderColor}`,
            borderRadius: theme.borderRadius,
            padding: '1rem'
          }}>
            <p style={{ color: theme.bodyColor, fontSize: theme.bodySize, margin: 0 }}>Thick border</p>
          </div>
        </div>
      </div>

      {/* Buttons Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '25% 75%', 
        gap: '1rem', 
        marginBottom: '1rem',
        background: `linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
        border: `${theme.borderWidth} solid ${theme.borderColor}`,
        borderRadius: theme.borderRadius,
        padding: '1rem'
      }}>
        {/* Controls */}
        <div>
          <h4 style={{ color: theme.titleColor, fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Buttons</h4>
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Button Background</label>
          <input type="text" value={theme.buttonBg} onChange={e => updateTheme('buttonBg', e.target.value)} 
            style={{ width: '100%', marginBottom: '0.75rem', padding: '0.4rem 0.6rem', background: 'rgba(0,10,20,0.8)', border: `1px solid rgba(52,224,255,0.3)`, borderRadius: '4px', color: theme.bodyColor, fontSize: theme.bodySize }} />
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Button Text Color</label>
          <input type="color" value={theme.buttonText} onChange={e => updateTheme('buttonText', e.target.value)} 
            style={{ width: '100%', height: '30px' }} />
        </div>
        
        {/* Preview */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={{
            background: theme.buttonBg,
            color: theme.buttonText,
            border: `1px solid ${theme.buttonBorder}`,
            borderRadius: '4px',
            padding: '0.4rem 1rem',
            fontSize: theme.bodySize,
            cursor: 'pointer',
            fontWeight: 600
          }}>Save</button>
          <button style={{
            background: theme.buttonBg,
            color: theme.buttonText,
            border: `1px solid ${theme.buttonBorder}`,
            borderRadius: '4px',
            padding: '0.4rem 1rem',
            fontSize: theme.bodySize,
            cursor: 'pointer',
            fontWeight: 600
          }}>Cancel</button>
          <button style={{
            background: theme.buttonBg,
            color: theme.buttonText,
            border: `1px solid ${theme.buttonBorder}`,
            borderRadius: '4px',
            padding: '0.4rem 1rem',
            fontSize: theme.bodySize,
            cursor: 'pointer',
            fontWeight: 600
          }}>Export Data</button>
        </div>
      </div>
      
      {/* Code, Badges, Tags, Values Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '25% 75%', 
        gap: '1rem', 
        marginBottom: '1rem',
        background: `linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
        border: `${theme.borderWidth} solid ${theme.borderColor}`,
        borderRadius: theme.borderRadius,
        padding: '1rem'
      }}>
        {/* Controls */}
        <div>
          <h4 style={{ color: theme.titleColor, fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code & Components</h4>
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem', marginTop: '0.5rem' }}>Code Text</label>
          <input type="color" value={theme.codeText} onChange={e => updateTheme('codeText', e.target.value)} 
            style={{ width: '100%', marginBottom: '0.75rem', height: '30px' }} />
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Badge Text</label>
          <input type="color" value={theme.badgeText} onChange={e => updateTheme('badgeText', e.target.value)} 
            style={{ width: '100%', marginBottom: '0.75rem', height: '30px' }} />
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Tag Text</label>
          <input type="color" value={theme.tagText} onChange={e => updateTheme('tagText', e.target.value)} 
            style={{ width: '100%', marginBottom: '0.75rem', height: '30px' }} />
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Value Highlight</label>
          <input type="color" value={theme.valueHighlightText} onChange={e => updateTheme('valueHighlightText', e.target.value)} 
            style={{ width: '100%', height: '30px' }} />
        </div>
        
        {/* Preview */}
        <div style={{ paddingRight: '1rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <h4 style={{ color: theme.bodyColor, fontSize: theme.bodySize, marginBottom: '0.3rem' }}>Inline Code:</h4>
            <code style={{
              background: theme.codeBg,
              color: theme.codeText,
              border: `1px solid ${theme.codeBorder}`,
              borderRadius: '4px',
              padding: '0.3rem 0.5rem',
              fontSize: theme.bodySize,
              fontFamily: 'monospace'
            }}>
              mechanic.baseValue = 10
            </code>
          </div>
          
          <div style={{ marginBottom: '0.75rem' }}>
            <h4 style={{ color: theme.bodyColor, fontSize: theme.bodySize, marginBottom: '0.3rem' }}>Badges:</h4>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              <span style={{
                background: theme.badgeBg,
                color: theme.badgeText,
                border: `1px solid ${theme.badgeBorder}`,
                borderRadius: '10px',
                padding: '0.15rem 0.5rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>PRIMARY</span>
              <span style={{
                background: theme.badgeBg,
                color: theme.badgeText,
                border: `1px solid ${theme.badgeBorder}`,
                borderRadius: '10px',
                padding: '0.15rem 0.5rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>ACTIVE</span>
            </div>
          </div>
          
          <div style={{ marginBottom: '0.75rem' }}>
            <h4 style={{ color: theme.bodyColor, fontSize: theme.bodySize, marginBottom: '0.3rem' }}>Tags:</h4>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              <span style={{
                background: theme.tagBg,
                color: theme.tagText,
                border: `1px solid ${theme.tagBorder}`,
                borderRadius: '4px',
                padding: '0.2rem 0.4rem',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>ship</span>
              <span style={{
                background: theme.tagBg,
                color: theme.tagText,
                border: `1px solid ${theme.tagBorder}`,
                borderRadius: '4px',
                padding: '0.2rem 0.4rem',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>weapon</span>
            </div>
          </div>
          
          <div>
            <h4 style={{ color: theme.bodyColor, fontSize: theme.bodySize, marginBottom: '0.3rem' }}>Value Highlight:</h4>
            <div style={{
              display: 'inline-block',
              background: theme.valueHighlightBg,
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              borderLeft: `3px solid ${theme.valueHighlightAccent}`
            }}>
              <span style={{
                color: theme.valueHighlightText,
                fontWeight: 600,
                fontSize: '0.85rem',
                fontFamily: 'monospace'
              }}>42</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '25% 75%', 
        gap: '1rem', 
        marginBottom: '1rem',
        background: `linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
        border: `${theme.borderWidth} solid ${theme.borderColor}`,
        borderRadius: theme.borderRadius,
        padding: '1rem'
      }}>
        {/* Controls */}
        <div>
          <h4 style={{ color: theme.titleColor, fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tables</h4>
          
          <p style={{ color: theme.bodyColor, fontSize: theme.bodySize, marginBottom: '0.5rem' }}>
            Table styling uses multiple theme variables (borders, colors, hover states).
          </p>
        </div>
        
        {/* Preview */}
        <div style={{ paddingRight: '1rem' }}>
          <div style={{
            background: `linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
            border: `${theme.borderWidth} solid ${theme.borderColor}`,
            borderRadius: theme.borderRadius,
            overflow: 'hidden',
            padding: '1rem'
          }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(0, 255, 255, 0.08)' }}>
                  <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: '#34e0ff', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Name</th>
                  <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: '#34e0ff', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Type</th>
                  <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: '#34e0ff', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {['Item Alpha', 'Item Beta'].map((item, idx) => (
                  <tr key={idx} style={{ background: theme.tableRowBg, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = theme.tableRowHover}
                    onMouseLeave={e => e.currentTarget.style.background = theme.tableRowBg}
                  >
                    <td style={{ padding: '0.5rem 1rem', color: theme.bodyColor, fontSize: theme.bodySize, borderBottom: `${theme.borderWidth} solid ${theme.borderColor}` }}>{item}</td>
                    <td style={{ padding: '0.5rem 1rem', color: theme.bodyColor, fontSize: theme.bodySize, borderBottom: `${theme.borderWidth} solid ${theme.borderColor}` }}>Standard</td>
                    <td style={{ padding: '0.5rem 1rem', color: theme.bodyColor, fontSize: theme.bodySize, borderBottom: `${theme.borderWidth} solid ${theme.borderColor}` }}>Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Banners Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '25% 75%', 
        gap: '1rem', 
        marginBottom: '1rem',
        background: `linear-gradient(${theme.gradientAngle}deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
        border: `${theme.borderWidth} solid ${theme.borderColor}`,
        borderRadius: theme.borderRadius,
        padding: '1rem'
      }}>
        {/* Controls */}
        <div>
          <h4 style={{ color: theme.titleColor, fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Info Banners</h4>
          
          <label style={{ color: theme.bodyColor, fontSize: theme.bodySize, display: 'block', marginBottom: '0.3rem' }}>Info Text</label>
          <input type="color" value={theme.infoText} onChange={e => updateTheme('infoText', e.target.value)} 
            style={{ width: '100%', height: '30px' }} />
        </div>
        
        {/* Preview */}
        <div style={{
          background: theme.infoBg,
          border: `${theme.borderWidth} solid ${theme.infoBorder}`,
          borderLeft: `3px solid ${theme.infoBorder}`,
          borderRadius: theme.borderRadius,
          padding: '0.75rem',
          color: theme.infoText,
          fontSize: theme.bodySize
        }}>
          <strong>â„¹ï¸ Information:</strong> This is an info banner used to display important contextual information to users.
        </div>
      </div>

    </div>
  );
};

export default UITemplate;
