import { Link } from 'react-router-dom';
import Button from '../components/Button';
import GoalCard from '../components/GoalCard';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';
import './Home.css';

const goals = [
  { icon: '🏋️', title: 'Muscle Building', description: 'Build lean muscle with structured hypertrophy training and progressive overload.' },
  { icon: '💪', title: 'Strength', description: 'Increase your raw strength with compound lifts and periodized programming.' },
  { icon: '⚽', title: 'Sports Performance', description: 'Enhance your athletic ability with sport-specific conditioning.' },
  { icon: '🏃', title: 'Endurance', description: 'Boost cardiovascular fitness and stamina for sustained performance.' },
  { icon: '✨', title: 'General Fitness', description: 'Achieve balanced health with well-rounded training and lifestyle habits.' },
  { icon: '🏆', title: 'Competition Prep', description: 'Peak for your event with timed nutrition, training, and recovery.' },
];

const features = [
  { icon: '📋', title: 'Personalized Workouts', description: 'Plans tailored to your body, goals, and schedule.' },
  { icon: '📈', title: 'Progress Tracking', description: 'Visualize your gains with clear, data-driven insights.' },
  { icon: '🥗', title: 'Nutrition Tracking', description: 'Log meals and monitor macros to fuel your performance.' },
  { icon: '🧠', title: 'Smart Planning', description: 'Adaptive plans that evolve as you progress.' },
  { icon: '🤖', title: 'Fitness Assistant', description: 'Get instant answers and guidance from an AI-powered coach.' },
];

const motivations = [
  { quote: 'The only bad workout is the one that didn\'t happen.', author: 'Consistency' },
  { quote: 'Your body can stand almost anything. It\'s your mind you have to convince.', author: 'Mental Strength' },
  { quote: 'Run when you can, walk if you have to, crawl if you must — just never stop.', author: 'Endurance' },
  { quote: 'Discipline is choosing between what you want now and what you want most.', author: 'Discipline' },
  { quote: 'Strength does not come from physical capacity. It comes from an indomitable will.', author: 'Strength' },
  { quote: 'The difference between the impossible and the possible lies in a person\'s determination.', author: 'Sports' },
];

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero__inner">
            <div className="hero__content">
              <div className="hero__badge">⚡ Your fitness, redefined</div>
              <h1 className="hero__title">
                YOUR GOAL.<br />
                YOUR JOURNEY.<br />
                YOUR <span>PLAN.</span>
              </h1>
              <p className="hero__desc">
                FitPilot creates a personalized fitness experience built around your goals, your lifestyle, and your pace. No guesswork — just a clear path forward.
              </p>
              <div className="hero__actions">
                <Link to="/dashboard">
                  <Button size="lg">Get Started</Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="secondary" size="lg">How It Works</Button>
                </a>
              </div>
            </div>
            <div className="hero__visual">
              <div className="hero__image-container">
                <div className="hero__image-placeholder">🏋️</div>
                <div className="hero__image-overlay" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section__header">
            <span className="section__tag">How It Works</span>
            <h2 className="section__title">Three steps to your best self</h2>
            <p className="section__desc">No complicated setup. Just a simple path from where you are to where you want to be.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-card__number">1</div>
              <h3 className="step-card__title">Create Your Profile</h3>
              <p className="step-card__desc">Tell us about yourself — your experience, your goals, and what drives you.</p>
              <div className="step-card__connector" />
            </div>
            <div className="step-card">
              <div className="step-card__number">2</div>
              <h3 className="step-card__title">Get Your Plan</h3>
              <p className="step-card__desc">Receive a personalized workout and nutrition plan designed for your specific goal.</p>
              <div className="step-card__connector" />
            </div>
            <div className="step-card">
              <div className="step-card__number">3</div>
              <h3 className="step-card__title">Track &amp; Progress</h3>
              <p className="step-card__desc">Log workouts, monitor nutrition, and watch your progress unfold over time.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="goals">
        <div className="container">
          <div className="section__header">
            <span className="section__tag">Goals</span>
            <h2 className="section__title">What do you want to achieve?</h2>
            <p className="section__desc">Whether you're building muscle, training for an event, or just getting started — we've got you.</p>
          </div>
          <div className="goals-grid">
            {goals.map((goal) => (
              <GoalCard key={goal.title} {...goal} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section__header">
            <span className="section__tag">Features</span>
            <h2 className="section__title">Everything you need to succeed</h2>
            <p className="section__desc">Tools designed to keep you focused, consistent, and moving forward.</p>
          </div>
          <div className="features-grid">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="section motivation">
        <div className="container">
          <div className="section__header">
            <span className="section__tag">Motivation</span>
            <h2 className="section__title">Fuel your fire</h2>
            <p className="section__desc">Words that push you forward on the days you need it most.</p>
          </div>
          <div className="motivation__grid">
            {motivations.map((m) => (
              <div className="motivation-card" key={m.author}>
                <p className="motivation-card__quote">"{m.quote}"</p>
                <span className="motivation-card__author">— {m.author}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2 className="cta__title">Ready to start your journey?</h2>
          <p className="cta__desc">Join FitPilot and discover what consistent, personalized training can do for you.</p>
          <Link to="/dashboard">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
