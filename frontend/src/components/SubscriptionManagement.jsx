import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  X
} from "lucide-react";
import { 
  getSubscriptionStatus, 
  cancelSubscription, 
  reactivateSubscription,
  changeSubscriptionPlan,
  createCheckoutSession
} from "../lib/subscriptionApi";
import { trackSubscriptionCancelled, trackSubscriptionActivated } from "../lib/premiumAnalytics";
import PremiumUpgradeModal from "./PremiumUpgradeModal";
import "./SubscriptionManagement.css";

function SubscriptionManagement() {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await getSubscriptionStatus();
      setSubscription(status);
      
      // Update localStorage for quick checks
      if (status.subscribed) {
        localStorage.setItem('premiumStatus', 'active');
      } else {
        localStorage.removeItem('premiumStatus');
      }
    } catch (err) {
      console.error('Error loading subscription status:', err);
      setError('Failed to load subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    try {
      setIsCanceling(true);
      setError(null);
      const result = await cancelSubscription();
      
      // Track cancellation
      if (subscription) {
        trackSubscriptionCancelled(
          subscription.plan,
          subscription.stripe_subscription_id,
          'user_initiated'
        );
      }
      
      setSuccess(result.message || 'Subscription will cancel at period end');
      await loadSubscriptionStatus(); // Refresh status
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setIsReactivating(true);
      setError(null);
      const result = await reactivateSubscription();
      
      // Track reactivation
      if (subscription) {
        trackSubscriptionActivated(
          subscription.plan,
          subscription.stripe_subscription_id
        );
      }
      
      setSuccess(result.message || 'Subscription reactivated');
      await loadSubscriptionStatus(); // Refresh status
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      setError(err.response?.data?.error || 'Failed to reactivate subscription');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleChangePlan = async (newPlan) => {
    if (!window.confirm(`Switch to ${newPlan} plan? Your subscription will be prorated.`)) {
      return;
    }

    try {
      setIsChangingPlan(true);
      setError(null);
      const result = await changeSubscriptionPlan(newPlan);
      setSuccess(result.message || `Plan changed to ${newPlan}`);
      await loadSubscriptionStatus(); // Refresh status
    } catch (err) {
      console.error('Error changing plan:', err);
      setError(err.response?.data?.error || 'Failed to change subscription plan');
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleUpgrade = async (plan) => {
    try {
      const checkoutUrl = await createCheckoutSession(plan);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Failed to start checkout. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={20} className="status-icon active" />;
      case 'canceled':
        return <AlertCircle size={20} className="status-icon canceled" />;
      case 'past_due':
        return <AlertCircle size={20} className="status-icon past-due" />;
      default:
        return <XCircle size={20} className="status-icon inactive" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'var(--primary-green, #0A9D58)';
      case 'canceled':
        return 'var(--warning-yellow, #F59E0B)';
      case 'past_due':
        return 'var(--danger-red, #EF4444)';
      default:
        return 'var(--text-secondary, #6b7280)';
    }
  };

  if (isLoading) {
    return (
      <div className="subscription-management">
        <div className="subscription-loading">
          <RefreshCw size={24} className="spinning" />
          <p>Loading subscription status...</p>
        </div>
      </div>
    );
  }

  // Free user - show upgrade option
  if (!subscription || !subscription.subscribed) {
    return (
      <div className="subscription-management">
        <div className="subscription-status-card free">
          <div className="status-header">
            <div className="status-icon-wrapper">
              <XCircle size={24} className="status-icon inactive" />
            </div>
            <div className="status-info">
              <h3 className="status-title">Free Plan</h3>
              <p className="status-description">You're currently on the free plan</p>
            </div>
          </div>

          <div className="subscription-features">
            <h4>Free Plan Includes:</h4>
            <ul>
              <li>5 conversions per month</li>
              <li>Top 2 halal alternatives</li>
              <li>Up to 10 saved recipes</li>
              <li>Text export</li>
            </ul>
          </div>

          <div className="subscription-actions">
            <button
              className="upgrade-button primary"
              onClick={() => setShowUpgradeModal(true)}
            >
              <Sparkles size={18} />
              Upgrade to Premium
            </button>
          </div>
        </div>

        {showUpgradeModal && (
          <PremiumUpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            triggerFeature="subscriptionManagement"
          />
        )}
      </div>
    );
  }

  // Premium user - show management options
  const { plan, status, expires_at, cancel_at_period_end } = subscription;
  const isCanceled = cancel_at_period_end || status === 'canceled';

  return (
    <div className="subscription-management">
      {error && (
        <div className="subscription-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="subscription-alert success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="subscription-status-card premium">
        <div className="status-header">
          <div className="status-icon-wrapper">
            {getStatusIcon(status)}
          </div>
          <div className="status-info">
            <h3 className="status-title">
              Premium Plan - {plan === 'monthly' ? 'Monthly' : 'Yearly'}
            </h3>
            <p className="status-description" style={{ color: getStatusColor(status) }}>
              Status: {status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
          </div>
        </div>

        <div className="subscription-details">
          <div className="detail-row">
            <Calendar size={18} className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Current Period:</span>
              <span className="detail-value">
                {formatDate(expires_at)}
              </span>
            </div>
          </div>

          <div className="detail-row">
            <CreditCard size={18} className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Plan:</span>
              <span className="detail-value">
                {plan === 'monthly' ? '$2.99/month' : '$29.99/year'}
              </span>
            </div>
          </div>

          {isCanceled && (
            <div className="detail-row warning">
              <AlertCircle size={18} className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Cancellation:</span>
                <span className="detail-value">
                  Will cancel on {formatDate(expires_at)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="subscription-features">
          <h4>Premium Features Active:</h4>
          <ul>
            <li>✓ Unlimited conversions</li>
            <li>✓ All halal alternatives</li>
            <li>✓ Unlimited recipe saves</li>
            <li>✓ PDF & JSON export</li>
            <li>✓ Strict Halal Mode</li>
            <li>✓ Brand-level verification</li>
          </ul>
        </div>

        <div className="subscription-actions">
          {/* Plan Change */}
          {!isCanceled && (
            <div className="plan-change-section">
              <h4>Change Plan:</h4>
              <div className="plan-buttons">
                <button
                  className={`plan-button ${plan === 'monthly' ? 'active' : ''}`}
                  onClick={() => handleChangePlan('monthly')}
                  disabled={isChangingPlan || plan === 'monthly'}
                >
                  {isChangingPlan && plan !== 'monthly' ? 'Switching...' : 'Monthly ($2.99/mo)'}
                </button>
                <button
                  className={`plan-button ${plan === 'yearly' ? 'active' : ''}`}
                  onClick={() => handleChangePlan('yearly')}
                  disabled={isChangingPlan || plan === 'yearly'}
                >
                  {isChangingPlan && plan !== 'yearly' ? 'Switching...' : 'Yearly ($29.99/yr) - Save 17%'}
                </button>
              </div>
            </div>
          )}

          {/* Cancel/Reactivate */}
          <div className="cancel-section">
            {isCanceled ? (
              <button
                className="action-button reactivate"
                onClick={handleReactivateSubscription}
                disabled={isReactivating}
              >
                {isReactivating ? 'Reactivating...' : 'Reactivate Subscription'}
              </button>
            ) : (
              <button
                className="action-button cancel"
                onClick={handleCancelSubscription}
                disabled={isCanceling}
              >
                {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionManagement;
