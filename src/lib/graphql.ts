import { createHash } from 'crypto';

import { decryptResponse } from '@/lib/crypto';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '';
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  return 'http://localhost:3000';
};

function hashQuery(query: string): string {
  // Use SubtleCrypto in browser, crypto in Node
  // For simplicity we pre-compute and inline — but we need sync hash client-side.
  // We use a simple djb2 for the browser and sha256 server-side via the same trim.
  // Actually: we just send the sha256 hex which matches what persisted-queries.ts computes.
  return query.trim();
}

export async function graphqlRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
  // Compute sha256 of the query to use as operationId
  let operationId: string;
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(query.trim());
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
    operationId = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    const { createHash } = await import('crypto');
    operationId = createHash('sha256').update(query.trim()).digest('hex');
  }

  const res = await fetch(`${getBaseUrl()}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ operationId, variables }),
  });

  const json = await res.json();
  // Decrypt the response payload
  const decrypted = json.d ? await decryptResponse<{ data?: T; errors?: any[] }>(json.d) : json;
  if (decrypted.errors) {
    console.error('GraphQL errors:', decrypted.errors);
    throw new Error(decrypted.errors[0].message);
  }
  return decrypted.data as T;
}

export const QUERIES = {
  DASHBOARD: `
    query Dashboard {
      dashboard {
        thisMonthIncome
        lastMonthIncome
        allTimeIncome
        recurringIncome
        thisMonthSpending
        lastMonthSpending
        incomeBySource {
          source
          amount
        }
        monthlyData {
          source
          amount
        }
        recentIncomes {
          id
          source
          amount
          category
          description
          date
        }
        recentSpendings {
          id
          name
          amount
          category
          description
          date
        }
        currentGoal {
          id
          title
          targetAmount
        }
        recurrings {
          id
          name
          amount
          isActive
        }
      }
    }
  `,

  PROFILE: `
    query Profile {
      profile {
        user {
          id
          name
          email
        }
        totalIncome
        totalRecurring
        incomes {
          id
          source
          amount
          category
          description
          date
        }
        goals {
          id
          title
          targetAmount
          month
          year
        }
        recurrings {
          id
          name
          amount
          isActive
        }
      }
    }
  `,

  EXPORT: `
    query Export {
      export {
        incomes {
          id
          source
          amount
          category
          description
          date
        }
        spendings {
          id
          name
          amount
          category
          description
          date
        }
        thisMonthIncome
        lastMonthIncome
        allTimeIncome
        thisMonthSpending
        lastMonthSpending
        allTimeSpending
        incomeBySource {
          source
          amount
        }
        user {
          name
          email
        }
      }
    }
  `,

  SPENDING: `
    query Spending {
      spending {
        thisMonthSpending
        lastMonthSpending
        allTimeSpending
        recentSpendings {
          id
          name
          amount
          category
          description
          date
        }
        spendingByCategory {
          source
          amount
        }
      }
    }
  `,

  GOALS: `
    query Goals {
      goals {
        id
        title
        targetAmount
        month
        year
      }
    }
  `,

  RECURRINGS: `
    query Recurrings {
      recurrings {
        id
        name
        amount
        category
        isActive
      }
    }
  `,
};

export const MUTATIONS = {
  ADD_INCOME: `
    mutation AddIncome($source: String!, $amount: Float!, $category: String, $description: String, $date: String!) {
      addIncome(source: $source, amount: $amount, category: $category, description: $description, date: $date)
    }
  `,

  UPDATE_INCOME: `
    mutation UpdateIncome($id: Int!, $source: String!, $amount: Float!, $category: String, $description: String, $date: String!) {
      updateIncome(id: $id, source: $source, amount: $amount, category: $category, description: $description, date: $date)
    }
  `,

  DELETE_INCOME: `
    mutation DeleteIncome($id: Int!) {
      deleteIncome(id: $id)
    }
  `,

  SET_GOAL: `
    mutation SetGoal($title: String!, $targetAmount: Float!) {
      setGoal(title: $title, targetAmount: $targetAmount) {
        success
        message
      }
    }
  `,

  DELETE_GOAL: `
    mutation DeleteGoal($id: Int!) {
      deleteGoal(id: $id)
    }
  `,

  ADD_RECURRING: `
    mutation AddRecurring($name: String!, $amount: Float!, $category: String) {
      addRecurring(name: $name, amount: $amount, category: $category)
    }
  `,

  TOGGLE_RECURRING: `
    mutation ToggleRecurring($id: Int!, $current: Int!) {
      toggleRecurring(id: $id, current: $current)
    }
  `,

  DELETE_RECURRING: `
    mutation DeleteRecurring($id: Int!) {
      deleteRecurring(id: $id)
    }
  `,

  ADD_SPENDING: `
    mutation AddSpending($name: String!, $amount: Float!, $category: String, $description: String, $date: String!) {
      addSpending(name: $name, amount: $amount, category: $category, description: $description, date: $date)
    }
  `,

  UPDATE_SPENDING: `
    mutation UpdateSpending($id: Int!, $name: String!, $amount: Float!, $category: String, $description: String, $date: String!) {
      updateSpending(id: $id, name: $name, amount: $amount, category: $category, description: $description, date: $date)
    }
  `,

  DELETE_SPENDING: `
    mutation DeleteSpending($id: Int!) {
      deleteSpending(id: $id)
    }
  `,

  DELETE_ACCOUNT: `
    mutation DeleteAccount {
      deleteAccount
    }
  `,

  UPDATE_PROFILE: `
    mutation UpdateProfile($name: String!) {
      updateProfile(name: $name)
    }
  `,

  UPDATE_PASSWORD: `
    mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
      updatePassword(currentPassword: $currentPassword, newPassword: $newPassword)
    }
  `,

  STATS: `
    query Stats {
      stats {
        totalUsers
        totalIncome
        totalIncomes
      }
    }
  `,
};
