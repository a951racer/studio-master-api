import { Types } from 'mongoose';
import LookupEntry from '../models/LookupEntry';
import Project from '../models/Project';

export interface StageSummary {
  stageId: string;
  stageName: string;
  count: number;
}

export interface DashboardData {
  activeStages: StageSummary[];
  completedStage: StageSummary;
  totalActive: number;
  totalCompleted: number;
}

/**
 * Fetches dashboard data: project counts grouped by workflow stage,
 * with the final stage (highest sequenceOrder) reported separately.
 */
export async function getDashboardData(): Promise<DashboardData> {
  // 1. Fetch all workflow-stage entries sorted by sequenceOrder
  const stages = await LookupEntry.find({
    listType: 'workflow-stage',
    clientId: null,
  }).sort({ sequenceOrder: 1 });

  // 2. Identify the final stage (highest sequenceOrder)
  const finalStage = stages[stages.length - 1];

  // 3. Use MongoDB aggregation to count projects grouped by workflowStageId
  const aggregation = await Project.aggregate([
    {
      $group: {
        _id: '$workflowStageId',
        count: { $sum: 1 },
      },
    },
  ]);

  // Build a map of stageId -> count from the aggregation results
  const countMap = new Map<string, number>();
  for (const entry of aggregation) {
    countMap.set((entry._id as Types.ObjectId).toString(), entry.count as number);
  }

  // 4. Build the response
  const activeStages: StageSummary[] = [];
  let totalActive = 0;

  for (const stage of stages) {
    const stageId = (stage._id as Types.ObjectId).toString();
    const count = countMap.get(stageId) || 0;

    // Skip the final stage — it goes into completedStage
    if (finalStage && stageId === (finalStage._id as Types.ObjectId).toString()) {
      continue;
    }

    activeStages.push({
      stageId,
      stageName: stage.name,
      count,
    });
    totalActive += count;
  }

  const finalStageId = finalStage
    ? (finalStage._id as Types.ObjectId).toString()
    : '';
  const totalCompleted = finalStage ? countMap.get(finalStageId) || 0 : 0;

  const completedStage: StageSummary = {
    stageId: finalStageId,
    stageName: finalStage ? finalStage.name : '',
    count: totalCompleted,
  };

  return {
    activeStages,
    completedStage,
    totalActive,
    totalCompleted,
  };
}
