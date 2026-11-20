import datetime
import json
from sqlalchemy import Column, String, Boolean, Float, DateTime, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

Base = declarative_base()

class VerificationSubmission(Base):
    __tablename__ = "verification_submissions"

    id = Column(String(64), primary_key=True, index=True)
    applicant_type = Column(String(32), default="company") # "individual" or "company"
    status = Column(String(32), default="USER_RETRY_REQUIRED", index=True) # AUTO_APPROVED, USER_RETRY_REQUIRED, OPS_MANUAL_REVIEW, OVERRIDDEN_APPROVED, OVERRIDDEN_REJECTED
    overall_passed = Column(Boolean, default=False)
    
    # Document filenames stored in uploads/
    pan_filename = Column(String(255), nullable=True)
    gst_filename = Column(String(255), nullable=True)
    cheque_filename = Column(String(255), nullable=True)
    
    # Extracted entity summary for quick table display
    merchant_name = Column(String(255), nullable=True)
    pan_number = Column(String(16), nullable=True)
    gstin = Column(String(20), nullable=True)
    
    # Serialized JSON execution results
    stage1_json = Column(Text, nullable=True)
    stage2_json = Column(Text, nullable=True)
    stage3_json = Column(Text, nullable=True)
    latencies_json = Column(Text, nullable=True)
    
    total_latency_ms = Column(Float, default=0.0)
    user_nudge = Column(Text, nullable=True)
    
    # Ops reviewer override
    override_status = Column(String(32), nullable=True)
    override_notes = Column(Text, nullable=True)
    override_by = Column(String(64), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "applicant_type": self.applicant_type,
            "status": self.status,
            "overall_passed": self.overall_passed,
            "pan_filename": self.pan_filename,
            "gst_filename": self.gst_filename,
            "cheque_filename": self.cheque_filename,
            "merchant_name": self.merchant_name,
            "pan_number": self.pan_number,
            "gstin": self.gstin,
            "stage1": json.loads(self.stage1_json) if self.stage1_json else None,
            "stage2": json.loads(self.stage2_json) if self.stage2_json else None,
            "stage3": json.loads(self.stage3_json) if self.stage3_json else None,
            "latencies": json.loads(self.latencies_json) if self.latencies_json else {},
            "total_latency_ms": self.total_latency_ms,
            "user_nudge": self.user_nudge,
            "override_status": self.override_status,
            "override_notes": self.override_notes,
            "override_by": self.override_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

# Auto-initialize SQLite tables on import
init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
