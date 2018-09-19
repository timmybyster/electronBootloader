//Word0
uint32_t ui8CurrentNmt			: 8;
uint32_t u3FrequencyNmtTET		: 3;
uint32_t u3FrequencyNmtTWI		: 3;
uint32_t u3FrequencyMap			: 3;
uint32_t u3FrequencyLoc			: 3;
uint32_t : 12;	//Reserved

//Word1
uint32_t ui4Language 			: 4;
uint32_t ui2Volume				: 2;
uint32_t ui2Backlight			: 2;
uint32_t ui1CurrentAdjMode		: 1;
uint32_t ui1LocDefault			: 2;
uint32_t ui5MapPulseWidths 		: 5;
uint32_t ui5LocPulseWidths 		: 5;
uint32_t : 11;	//Reserved

//Word2
uint32_t ui1ProximityIndicator	: 1;
uint32_t ui8ProximityLow		: 8;
uint32_t ui8ProximityHigh		: 8;
uint32_t ui4LocCurrentIncr1		: 4;
uint32_t ui5LocCurrentIncr2		: 5;
uint32_t ui6LocCurrentIncr3		: 6;

//Word3
uint32_t ui32StartupCounter;

//Word4 - Word5
uint32_t ui32MapSecondsCounter;
uint32_t ui32LocSecondsCounter;

//Word6 - Word10
uint32_t ui32TofCounter;
uint32_t ui32DbCounter;
uint32_t ui32TetCounter;
uint32_t ui32TwiCounter;
uint32_t ui32PtcCounter;

//Word11 - Word12
uint32_t ui32SmcNonFacialCounter;
uint32_t ui32SmcFacialCounter;

//Word13 - Word14
uint32_t ui32AtmSmcNonFacialCounter;
uint32_t ui32AtmSmcFacialCounter;
//Word15 - Word26
uint32_t ui32AtmRecoveredNonFacialCounter;
uint32_t ui32AtmRecoveredFacialCounter;
uint32_t ui32AtmMinimalNonFacialCounter;
uint32_t ui32AtmMinimalFacialCounter;
uint32_t ui32AtmShallowNonFacialCounter;
uint32_t ui32AtmShallowFacialCounter;
uint32_t ui32AtmModerateNonFacialCounter;
uint32_t ui32AtmModerateFacialCounter;
uint32_t ui32AtmDeepNonFacialCounter;
uint32_t ui32AtmDeepFacialCounter;
uint32_t ui32AtmProfoundNonFacialCounter;
uint32_t ui32AtmProfoundFacialCounter;

//Word27
uint32_t : 32;

//Word28
uint32_t ui16TOF_RefrTime_s		: 16;
uint32_t ui16TOF_RptTime_s		: 16;

//Word29
uint32_t ui16DB_RefrTime_s		: 16;
uint32_t ui16DB_RptTime_s		: 16;

//Word30
uint32_t ui16PTC_RefrTime_s		: 16;
uint32_t ui16PTC_RptTime_s		: 16;

//Word31
uint32_t ui16ATM_TOF_RefrTime_s	: 16;
uint32_t ui16ATM_PTC_RefrTime_s	: 16;

//Word32 - Word35
uint32_t ui16ATM_Recovered_RptTime_s	: 16;
uint32_t ui16ATM_Minimal_RptTime_s		: 16;
uint32_t ui16ATM_Shallow_RptTime_s		: 16;
uint32_t ui16ATM_Moderate_RptTime_s		: 16;
uint32_t ui16ATM_Deep_RptTime_s			: 16;
uint32_t ui16ATM_Profound_RptTime_s		: 16;
uint32_t : 32;

//Word36 - Word40
uint32_t ui32UserDataLine1[USER_DATA_LEN];

//Word41 - Word45
uint32_t ui32UserDataLine2[USER_DATA_LEN];

//Word46 - Word55
uint32_t ui32NonLinear[NON_LINEAR_DATA_LEN];

//Word56 - Word58
uint32_t : 32;
uint32_t : 32;
uint32_t : 32;

//Word59
uint32_t ui32XSum;