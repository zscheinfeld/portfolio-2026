import { getProjectBySlug } from '@/lib/contentful';

export default async function handler(req, res) {
  const { slug } = req.query;

  try {
    const project = await getProjectBySlug(slug);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json({ contentBlocks: project.contentBlocks });
  } catch (error) {
    console.error('Error fetching project content:', error);
    res.status(500).json({ error: 'Failed to fetch project content' });
  }
}
