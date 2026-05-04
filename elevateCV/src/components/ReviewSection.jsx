import React, { useState, useEffect, useRef } from 'react';
import './ReviewSection.css';

const ReviewSection = () => {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: "Rohan S.",
      rating: 5,
      comment: "Absolutely the best ATS resume builder I've ever used. The AI prompt approach is much faster than filling out traditional forms.",
      date: "2025-01-12"
    },
    {
      id: 2,
      name: "Sneha K.",
      rating: 4,
      comment: "The job matching feature is surprisingly accurate. Helped me find a role at a top-tier firm in Bangalore.",
      date: "2025-02-05"
    },
    {
      id: 3,
      name: "Ankit M.",
      rating: 5,
      comment: "The brutalist design is refreshing and efficient. No distractions, just high-quality results. Highly recommend!",
      date: "2025-03-10"
    },
    {
      id: 4,
      name: "Priya V.",
      rating: 5,
      comment: "Love the JD optimization. It showed me exactly what was missing in my CV compared to the job description.",
      date: "2025-03-15"
    }
  ]);

  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 5 });
  const [showForm, setShowForm] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('elevate_reviews');
    if (saved) {
      setReviews(JSON.parse(saved));
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;
    
    const updated = [
      {
        id: Date.now(),
        ...newReview,
        date: new Date().toISOString().split('T')[0]
      },
      ...reviews
    ];
    setReviews(updated);
    localStorage.setItem('elevate_reviews', JSON.stringify(updated));
    setNewReview({ name: '', comment: '', rating: 5 });
    setShowForm(false);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    
    // Calculate which index is most visible
    const cardWidthWithGap = 380 + 32; 
    const index = Math.round(scrollLeft / cardWidthWithGap);
    if (index !== activeIndex) {
        setActiveIndex(index);
    }
  };

  const scrollTo = (index) => {
    if (!scrollRef.current) return;
    const cardWidthWithGap = 380 + 32;
    scrollRef.current.scrollTo({ left: index * cardWidthWithGap, behavior: 'smooth' });
  };

  return (
    <section className="review-section container">
      <div className="section-header">
        <h2 className="bebas">USER REVIEWS ✦ TESTIMONIALS</h2>
        <button className="btn btn-outline" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'CLOSE FORM' : 'GIVE REVIEW'}
        </button>
      </div>

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="mono">YOUR NAME</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Full Name" 
              value={newReview.name}
              onChange={(e) => setNewReview({...newReview, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="mono">RATING</label>
            <div className="rating-select">
              {[1, 2, 3, 4, 5].map(num => (
                <button 
                  key={num}
                  type="button"
                  className={`rating-btn mono ${newReview.rating === num ? 'active' : ''}`}
                  onClick={() => setNewReview({...newReview, rating: num})}
                >
                  {num} ★
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="mono">YOUR EXPERIENCE</label>
            <textarea 
              className="input" 
              placeholder="Tell us what you like about Elevate CV..." 
              rows="4"
              value={newReview.comment}
              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn btn-solid">PUBLISH MY REVIEW</button>
        </form>
      )}

      <div 
        className="reviews-grid" 
        ref={scrollRef} 
        onScroll={handleScroll}
      >
        {reviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-meta">
              <span className="review-name bebas">{review.name}</span>
              <span className="review-rating mono">
                {"✦".repeat(review.rating)}{"✧".repeat(5 - review.rating)}
              </span>
            </div>
            <p className="review-comment sans">{review.comment}</p>
            <div className="review-date mono">{review.date}</div>
          </div>
        ))}
      </div>

      <div className="review-pagination">
        {reviews.map((_, i) => (
          <button 
            key={i} 
            className={`pagination-dot ${activeIndex === i ? 'active' : ''}`}
            onClick={() => scrollTo(i)}
            aria-label={`Go to review ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default ReviewSection;
