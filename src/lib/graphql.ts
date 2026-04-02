const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '';
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  return 'http://localhost:3000';
};

export async function graphqlRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(`${getBaseUrl()}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    console.error('GraphQL errors:', json.errors);
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

export const QUERIES = {
  DASHBOARD: `
    query Dashboard {
      dashboard {
        thisMonthIncome
        lastMonthIncome
        allTimeIncome
        recurringIncome
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
        thisMonthIncome
        lastMonthIncome
        allTimeIncome
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
