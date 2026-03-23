import styles from "@/styles/ContentBlock.module.css";

export default function ContentBlock({ block }) {
  switch (block.blockType) {
    case 'fullWidthImage':
      return (
        <div className={styles.fullWidthImage}>
          <img src={`https:${block.imageUrl}`} alt={block.caption || ''} />
          {block.caption && <p className={styles.caption}>{block.caption}</p>}
        </div>
      );

    case 'sideBySideImages':
      return (
        <div className={styles.sideBySide}>
          <div className={styles.imageHalf}>
            <img src={`https:${block.imageLeftUrl}`} alt="" />
          </div>
          <div className={styles.imageHalf}>
            <img src={`https:${block.imageRightUrl}`} alt="" />
          </div>
          {block.caption && <p className={styles.caption}>{block.caption}</p>}
        </div>
      );

      case 'vimeoEmbed': {
        // Extract Vimeo ID from URL
        const vimeoId = block.vimeoUrl?.split('/').pop();
        return (
          <div className={styles.videoEmbed}>
            <div className={styles.videoWrapper}>
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&loop=1&autopause=0&muted=1&background=1`}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
            {block.caption && <p className={styles.caption}>{block.caption}</p>}
          </div>
        );
      }

      case 'youtubeEmbed': {
        // Extract YouTube ID from various URL formats
        let youtubeId = '';
        if (block.youtubeUrl) {
          const url = block.youtubeUrl;
          // Handle youtu.be short links
          if (url.includes('youtu.be/')) {
            youtubeId = url.split('youtu.be/')[1].split('?')[0];
          }
          // Handle youtube.com/watch?v= links
          else if (url.includes('watch?v=')) {
            youtubeId = url.split('watch?v=')[1].split('&')[0];
          }
          // Handle youtube.com/embed/ links
          else if (url.includes('embed/')) {
            youtubeId = url.split('embed/')[1].split('?')[0];
          }
        }
        return (
          <div className={styles.videoEmbed}>
            <div className={styles.videoWrapper}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&mute=1&playlist=${youtubeId}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
            {block.caption && <p className={styles.caption}>{block.caption}</p>}
          </div>
        );
      }

      case 'videoFile':
        return (
          <div className={styles.videoEmbed}>
            <div className={styles.videoWrapper}>
              <video
                src={`https:${block.videoUrl}`}
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
            {block.caption && <p className={styles.caption}>{block.caption}</p>}
          </div>
        );

    case 'websiteEmbed':
      return (
        <div className={styles.websiteEmbed}>
          <div className={styles.iframeWrapper}>
            <iframe
              src={block.websiteUrl}
              frameBorder="0"
              title="Website embed"
            />
          </div>
          {block.caption && <p className={styles.caption}>{block.caption}</p>}
        </div>
      );

    case 'textBlock':
      return (
        <div className={styles.textBlock}>
          <p>{block.textContent}</p>
        </div>
      );

    default:
      return null;
  }
}