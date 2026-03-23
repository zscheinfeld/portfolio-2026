import { createClient } from 'contentful';

const spaceId = (process.env.CONTENTFUL_SPACE_ID || '').replace(/[^\x20-\x7E]/g, '').trim();
const accessToken = (process.env.CONTENTFUL_ACCESS_TOKEN || '').replace(/[^\x20-\x7E]/g, '').trim();

if (!spaceId || !accessToken) {
  throw new Error(
    `Missing Contentful env vars: CONTENTFUL_SPACE_ID=${spaceId ? 'set' : 'MISSING'}, CONTENTFUL_ACCESS_TOKEN=${accessToken ? 'set' : 'MISSING'}`
  );
}

const client = createClient({
  space: spaceId,
  accessToken: accessToken,
});

export async function getAllProjects() {
    const entries = await client.getEntries({
      content_type: 'project',
      order: '-fields.date',
      include: 2, // Include referenced content blocks
    });
  
    return entries.items.map(item => ({
      id: item.sys.id,
      slug: item.fields.slug,
      title: item.fields.title,
      date: item.fields.date,
      category: item.fields.category,
      image: item.fields.thumbnail?.fields?.file?.url || '',
      description: item.fields.description || null,
      contentBlockCount: item.fields.contentBlocks?.length || 0,
    }));
  }
  
  export async function getProjectBySlug(slug) {
    const entries = await client.getEntries({
      content_type: 'project',
      'fields.slug': slug,
      limit: 1,
      include: 2, // Include referenced content blocks
    });
  
    if (!entries.items.length) return null;
  
    const item = entries.items[0];
    
    // Process content blocks
    const contentBlocks = item.fields.contentBlocks?.map(block => {
      const blockData = {
        id: block.sys.id,
        blockType: block.fields.blockType || null,
        caption: block.fields.caption || null,
        order: block.fields.order || 0,
        hideFromGrid: block.fields.hideFromGrid === true,
      };
  
      // Add type-specific fields
      switch (block.fields.blockType) {
        case 'fullWidthImage':
          blockData.imageUrl = block.fields.image?.fields?.file?.url || null;
          break;
        case 'sideBySideImages':
          blockData.imageLeftUrl = block.fields.imageLeft?.fields?.file?.url || null;
          blockData.imageRightUrl = block.fields.imageRight?.fields?.file?.url || null;
          break;
        case 'vimeoEmbed':
          blockData.vimeoUrl = block.fields.vimeoUrl || null;
          break;
        case 'youtubeEmbed':
          blockData.youtubeUrl = block.fields.youtubeUrl || null;
          break;
        case 'videoFile':
          blockData.videoUrl = block.fields.videoUrl?.fields?.file?.url || null;
          blockData.showControls = block.fields.showControls !== false;
          break;
        case 'websiteEmbed':
          blockData.websiteUrl = block.fields.websiteUrl || null;
          break;
        case 'textBlock':
          blockData.textContent = block.fields.textContent || null;
          break;
      }
  
      return blockData;
    }) || [];
  
    return {
      id: item.sys.id,
      slug: item.fields.slug,
      title: item.fields.title,
      date: item.fields.date,
      category: item.fields.category,
      image: item.fields.thumbnail?.fields?.file?.url || '',
      description: item.fields.description || null,
      contentBlocks,
    };
  }

export async function getCVItems() {
    const entries = await client.getEntries({
        content_type: 'cvItem', // Must match your Contentful content type ID
        order: 'fields.order', // Sort by manual order
  });

  return entries.items.map(item => ({
    id: item.sys.id,
    category: item.fields.category || null,
    title: item.fields.title,
    organization: item.fields.organization || null,
    location: item.fields.location || null,
    yearRange: item.fields.yearRange || null,
    description: item.fields.description || null,
    order: item.fields.order || 0,
  }));
}

export default client;