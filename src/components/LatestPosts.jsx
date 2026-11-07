import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../api/client.js';
import { getPreloaded } from '../data/preload.js';
import PostCard from './PostCard.jsx';

// "From the blog" on the home page: the 3 newest posts (hidden when there are none)
export default function LatestPosts() {
  const [posts, setPosts] = useState(() => (getPreloaded('posts') || []).slice(0, 3).map((p) => p.post || p));

  useEffect(() => {
    api('/api/site/blog').then((r) => setPosts(r.posts.slice(0, 3))).catch(() => {});
  }, []);

  if (!posts.length) return null;
  return (
    <section className="section section--tinted">
      <div className="container">
        <div className="section__head section__head--row">
          <div>
            <p className="eyebrow">From the blog</p>
            <h2>Ideas for running your business</h2>
          </div>
          <Link to="/blog" className="btn btn--outline">All posts <ArrowRight size={16} /></Link>
        </div>
        <div className="post-grid">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      </div>
    </section>
  );
}
