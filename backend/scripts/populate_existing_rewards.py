"""
Script to populate reward records for existing completed matches
This will create reward records for all matches that have tagged events but no reward records
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Fixture, MatchEvent, MatchReward, User
from services.reward_service import RewardService
from sqlalchemy import and_, func

def populate_existing_rewards():
    """Populate reward records for existing completed matches"""
    db = SessionLocal()

    try:
        print("🔍 Scanning for completed matches with tagged events...")

        # Find all completed matches that have events but no reward records
        completed_matches_with_events = db.query(
            Fixture.id,
            Fixture.status,
            func.count(MatchEvent.id).label('event_count'),
            func.count(func.distinct(MatchEvent.created_by)).label('tagger_count')
        ).join(
            MatchEvent, Fixture.id == MatchEvent.fixture_id
        ).outerjoin(
            MatchReward, and_(
                MatchReward.fixture_id == Fixture.id,
                MatchReward.tagger_id == MatchEvent.created_by
            )
        ).filter(
            and_(
                Fixture.status == 'completed',
                MatchEvent.created_by.isnot(None),
                MatchReward.id.is_(None)  # No reward record exists
            )
        ).group_by(Fixture.id, Fixture.status).all()

        if not completed_matches_with_events:
            print("ℹ️  No completed matches found that need reward population")
            return

        print(f"✅ Found {len(completed_matches_with_events)} completed matches needing rewards")

        reward_service = RewardService(db)
        total_rewards_created = 0

        for match in completed_matches_with_events:
            fixture_id = match.id
            event_count = match.event_count
            tagger_count = match.tagger_count

            print(f"\n🏆 Processing Match ID {fixture_id}: {event_count} events by {tagger_count} tagger(s)")

            # Get all unique taggers who worked on this match
            taggers = db.query(MatchEvent.created_by).filter(
                and_(
                    MatchEvent.fixture_id == fixture_id,
                    MatchEvent.created_by.isnot(None)
                )
            ).distinct().all()

            # Create and finalize reward records for each tagger
            for (tagger_id,) in taggers:
                if tagger_id:
                    # Get tagger info
                    tagger = db.query(User).filter(User.id == tagger_id).first()
                    tagger_name = tagger.username if tagger else f"User#{tagger_id}"

                    # Count events by this tagger
                    events_by_tagger = db.query(func.count(MatchEvent.id)).filter(
                        and_(
                            MatchEvent.fixture_id == fixture_id,
                            MatchEvent.created_by == tagger_id
                        )
                    ).scalar() or 0

                    print(f"  👤 {tagger_name}: {events_by_tagger} events")

                    # Create reward record
                    reward = reward_service.create_or_update_match_reward(fixture_id, tagger_id)

                    # Since these are historical matches, assume perfect accuracy (no admin edits)
                    reward.is_finalized = True
                    reward.finalized_at = db.query(Fixture.updated_at).filter(Fixture.id == fixture_id).scalar()

                    total_rewards_created += 1

                    print(f"    💰 Reward: ${reward.final_reward:.2f} (Accuracy: {reward.accuracy_percentage:.1f}%)")

        db.commit()

        print(f"\n🎉 Successfully created {total_rewards_created} reward records!")
        print(f"💡 Taggers can now see their historical performance and earnings")
        print(f"🏆 Leaderboard should now be populated with data")

        # Show summary stats
        total_rewards = db.query(func.sum(MatchReward.final_reward)).filter(
            MatchReward.is_finalized == True
        ).scalar() or 0

        active_taggers = db.query(func.count(func.distinct(MatchReward.tagger_id))).filter(
            MatchReward.is_finalized == True
        ).scalar() or 0

        avg_accuracy = db.query(func.avg(MatchReward.accuracy_percentage)).filter(
            MatchReward.is_finalized == True
        ).scalar() or 0

        print(f"\n📊 System Summary:")
        print(f"   Total Rewards: ${total_rewards:.2f}")
        print(f"   Active Taggers: {active_taggers}")
        print(f"   Average Accuracy: {avg_accuracy:.1f}%")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    populate_existing_rewards()