import Head from 'next/head';
import React, { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        console.error(json);
      }
    } catch (err) {
      setStatus('error');
      console.error(err);
    }
  };

  return (
    <>
      <Head>
        <title>ZK-ID — Private by Design</title>
        <meta name="description" content="ZK-ID — privacy-first decentralized identity powered by zero-knowledge proofs" />
      </Head>

      <div className="container">
        <header style={{display:'flex',justifyContent:'center', padding:'1rem 0'}}>
          <img className="logo" src="/logo.jpg" alt="ZK-ID" />
        </header>

        <section className="hero">
          <h1 className="h1">Your identity. Private by design.</h1>
          <p className="lead">
            ZK-ID is a privacy-preserving identity layer built with zero-knowledge proofs. Own your credentials and verify without revealing them.
          </p>

          <form onSubmit={submit} className="form-row" aria-label="Join waitlist">
            <input
              className="input"
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
            <button className="btn" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Joining…' : 'Join Waitlist'}
            </button>
          </form>

          {status === 'success' && <p style={{color:'#014D4E', marginTop:12}}>✅ You're on the waitlist — check your email for confirmation.</p>}
          {status === 'error' && <p style={{color:'#A0522D', marginTop:12}}>Something went wrong — please try again later.</p>}
        </section>

        <section style={{marginTop:24}}>
          <h3 style={{textAlign:'center'}}>Use cases</h3>
          <div className="use-cases">
            <div className="card"><h4>Anonymous Voting</h4><p>Participate in governance while preserving voter privacy.</p></div>
            <div className="card"><h4>Private Login</h4><p>Authenticate without exposing personal information.</p></div>
            <div className="card"><h4>Age Verification</h4><p>Prove eligibility without sharing personal data.</p></div>
          </div>
        </section>

        <footer className="footer">zk-id.xyz © {new Date().getFullYear()}</footer>
      </div>
    </>
  );
}
