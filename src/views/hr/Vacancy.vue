<!-- src/views/hr/VacanciesManage.vue -->
<template>

  <div class="flex flex-col">
    <!-- Header -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex items-center justify-between p-4 border-b rounded-md border-gray-200">
        <div class="flex items-center gap-2">
          <p class="text-xl font-semibold">{{ $t('vacancies') || 'Թեկնածուներ' }}</p>
          <p class="text-sm text-slate-500">({{ $t('hr') || 'Կադրեր' }})</p>
        </div>

      </div>
    </div>

    <!-- Breadcrumb -->
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link
              :to="'/hr'"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
          >
            <span class="underline-offset-2 hover:underline">{{ $t('hr') || 'Կադրեր' }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path
                d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ $t('candidates') || 'Թեկնածուներ' }}</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>
  <div class="flex flex-col gap-4 px-4 py-4">

    <!-- Error banner -->
    <div v-if="uiError" class="rounded-xl border border-red-200 bg-red-50 text-red-800 p-3">
      {{ uiError }}
    </div>
    <!-- Toolbar -->
    <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="p-4 flex flex-wrap items-center justify-between gap-3 border-b">
        <div class="text-lg font-semibold">{{ t('vacancies') || 'Թափուր աշխատատեղեր' }}</div>
        <div class="flex flex-wrap items-center gap-2">
          <input
              v-model.trim="q"
              @input="debouncedReload"
              :placeholder="t('search_placeholder') || 'Որոնել՝ վերնագիր, նկարագրություն, փուլ…'"
              class="border border-gray-300 rounded-xl px-3 py-2 w-[220px] md:w-[320px]"
          />
          <select v-model="status" @change="reloadAll(true)" class="border border-gray-300 rounded-xl px-3 py-2">
            <option value="">{{ t('all') || 'Բոլորը' }}</option>
            <option v-for="s in statusOptions" :key="s" :value="s">{{ statusLabel(s) }}</option>
          </select>
          <select v-model="department" @change="reloadAll(true)" class="border border-gray-300 rounded-xl px-3 py-2">
            <option value="">{{ t('all_departments') || 'Բոլոր բաժինները' }}</option>
            <option v-for="d in departmentOptions" :key="String(d.value)" :value="String(d.value)">{{
                d.label
              }}
            </option>
          </select>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="p-4 hidden md:block">
        <div class="rounded-xl border border-gray-200 overflow-hidden">
          <div ref="scrollBox" class="max-h-[70vh] overflow-auto" @scroll="onScroll">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 sticky top-0 z-10 text-left">
              <tr>
                <th class="px-3 py-2 w-16">#</th>
                <th class="px-3 py-2">{{ t('title') || 'Title' }}</th>
                <th class="px-3 py-2">{{ t('description') || 'Description' }}</th>
                <th class="px-3 py-2">{{ t('role') || 'Role' }}</th>
                <th class="px-3 py-2">{{ t('department') || 'Department' }}</th>
                <th class="px-3 py-2 w-28">{{ t('status') || 'Status' }}</th>
                <th class="px-3 py-2 w-24">{{ t('slots') || 'Slots' }}</th>
                <th class="px-3 py-2 w-[560px]"></th>
              </tr>
              </thead>
              <tbody>
              <template v-for="v in rows" :key="v.id">
                <tr class="border-t align-top">
                  <td class="px-3 py-2 font-mono">#{{ v.id }}</td>
                  <td class="px-3 py-2">{{ v.title ?? `—` }}</td>
                  <td class="px-3 py-2 text-slate-700">
                    <div class="line-clamp-2">{{ v.description || '—' }}</div>
                  </td>
                  <td class="px-3 py-2">{{ displayRole(v) }}</td>
                  <td class="px-3 py-2">{{ displayDept(v) }}</td>
                  <td class="px-3 py-2">
                    <span class="px-2 py-0.5 rounded text-xs" :class="statusClass(v.status)">{{
                        statusLabel(v.status)
                      }}</span>
                  </td>
                  <td class="px-3 py-2">
                    <span>{{ v.slots ?? '—' }}</span>
                    <span v-if="countHired(v) > 0" class="ml-2 text-xs text-green-700">
                        ({{ t('hired') || 'հաստատված' }}: {{ countHired(v) }})
                      </span>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex flex-wrap gap-2">
                      <button
                          v-if="(v.applications?.length || 0) > 0"
                          class="cursor-pointer px-3 py-1 text-xs rounded-md border"
                          @click="toggleOpen(v.id)"
                      >
                        {{ t('candidates') || 'Թեկնածուներ' }} ({{ v.applications.length }})
                      </button>

                      <button
                          v-if="canAddCandidates(v)"
                          class="cursor-pointer px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                          @click="openCandidates(v)"
                      >
                        {{ t('add_candidate') || 'Ավելացնել թեկնածու' }}
                      </button>

                      <template v-if="isPending(v)">
                        <button class="cursor-pointer px-3 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700"
                                @click="approve(v)">
                          {{ t('approve') || 'Հաստատել' }}
                        </button>
                        <button class="cursor-pointer px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                                @click="reject(v)">
                          {{ t('reject') || 'Մերժել' }}
                        </button>
                        <button
                            class="cursor-pointer px-3 py-1 text-xs rounded-md border   text-white bg-indigo-700 hover:bg-indigo-600"
                            @click="openEdit(v)"

                        >
                          {{ t('edit') || 'Խմբագրել' }}
                        </button>
                      </template>

                      <template v-else-if="isCanceled(v)">
                        <span class="text-xs text-slate-500">{{ t('no_actions') || 'Գործողություններ չկան' }}</span>
                      </template>

                      <template v-else-if="isActive(v)">
                        <button
                            class="cursor-pointer px-3 py-1 text-xs rounded-md border text-white  bg-indigo-700 hover:bg-indigo-600"
                            @click="openEdit(v)"
                        >
                          {{ t('edit') || 'Խմբագրել' }}
                        </button>
                        <button class="cursor-pointer px-3 py-1 text-xs rounded-md border bg-gray-400 text-white hover:bg-gray-500" @click="archive(v)">
                          {{ t('archive') || 'Արխիվացնել' }}
                        </button>
                      </template>

                      <template v-else-if="isClosed(v)">
                        <span class="text-xs text-slate-500">{{ t('closed') || 'Արխիվացված' }}</span>
                      </template>
                    </div>
                  </td>
                </tr>

                <!-- Inline candidates panel -->
                <tr v-if="isOpen(v.id)" class="bg-slate-50">
                  <td colspan="8" class="px-3 py-3">
                    <div class="flex flex-col gap-3">
                      <!-- Summary + Slot enforcement -->
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="text-sm text-slate-700">
                          <b>{{ t('candidates') || 'Թեկնածուներ' }}:</b>
                          <span class="ml-1">{{ (v.applications || []).length }}</span>
                          <span class="ml-3" v-if="hasStages(v)">
                              <b>{{ t('stages') || 'Փուլեր' }}:</b>
                              <span>{{ stageNames(v).join(' → ') || '—' }}</span>
                            </span>
                        </div>
                        <div
                            v-if="hasStages(v) && countHired(v) >= (v.slots || 0) && othersNonRejectedCount(v) > 0"
                            class="flex items-center gap-2"
                        >
                            <span class="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              {{ t('slots_filled') || 'Լրացված է' }} ({{ countHired(v) }}/{{ v.slots }})
                            </span>
                          <button class="px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                                  @click="rejectOthers(v)">
                            {{ t('reject_others') || 'Մերժել մնացածին' }}
                          </button>
                        </div>
                      </div>

                      <!-- Candidate table -->
                      <div class="rounded-xl border border-gray-200 overflow-hidden">
                        <div class="max-h-[46vh] overflow-auto">
                          <table class="min-w-full text-sm">
                            <thead class="bg-gray-100 sticky top-0 z-10 text-left">
                            <tr>
                              <th class="px-3 py-2 w-16">#</th>
                              <th class="px-3 py-2">{{ t('full_name') || 'Անուն Ազգանուն' }}</th>
                              <th class="px-3 py-2">{{ t('status') || 'Կարգավիճակ' }}</th>
                              <th v-if="hasStages(v)" class="px-3 py-2">{{ t('stage') || 'Փուլ' }}</th>
                              <th class="px-3 py-2 w-[420px]"></th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="a in (v.applications || [])" :key="a.id" class="border-t">
                              <td class="px-3 py-2 font-mono">#{{ a.candidate_id }}</td>
                              <td class="px-3 py-2">
                                <div class="font-medium">
                                  {{ a.candidate?.first_name }} {{ a.candidate?.last_name }}
                                </div>
                                <div class="text-xs text-slate-500">
                                  {{ a.candidate?.email || a.candidate?.phone || '—' }}
                                </div>
                              </td>
                              <td class="px-3 py-2">
                                    <span class="px-2 py-0.5 rounded text-xs" :class="appStatusClass(a.status)">
                                      {{ appStatusLabel(a.status) }}
                                    </span>
                              </td>

                              <td v-if="hasStages(v)" class="px-3 py-2">
                                <div class="text-xs">
                                      <span class="font-medium">
                                        {{ isInterviewing(a) ? stageLabel(v, a) : currentStageLabelOrDash(v, a) }}
                                      </span>
                                </div>
                              </td>

                              <td class="px-3 py-2" v-if="v.status!=='closed'">
                                 <div class="flex flex-wrap gap-2">
                                  <!-- Start interview -->
                                  <button
                                      v-if="hasStages(v) && isInReview(a)"
                                      class="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                      @click="startInterview(v, a)"
                                  >
                                    {{ t('interview') || 'Հարցազրույց' }}
                                  </button>

                                   <!-- NEXT: show only while interviewing AND when there is a next stage -->
                                  <button
                                      v-if="hasStages(v) && isInterviewing(a) && hasNextStage(v, a)"
                                      class="cursor-pointer px-3 py-1 text-xs rounded-md border"
                                      @click="nextStage(v, a)"
                                  >

                                    {{nextStageOf(v,a.meta.stage_id)?.name}}
                                  </button>

                                  <!-- Hide Hire/Reject only when final -->
                                  <template v-if="!isFinal(a)">
                                    <button
                                        class="cursor-pointer px-3 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                                        @click="hire(v, a)"
                                        :disabled="!canHire(v, a)"
                                    >
                                      {{ t('hire') || 'Ընդունել' }}
                                    </button>
                                    <button class="cursor-pointer px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                                            @click="rejectApp(v, a)">
                                      {{ t('reject') || 'Մերժել' }}
                                    </button>
                                  </template>

                                  <!-- For vacancies without stages allow detach -->
                                  <button
                                      v-if="!hasStages(v)"
                                      class="px-3 py-1 text-xs rounded-md border hover:bg-red-50 text-red-600"
                                      @click="removeCandidateSimple(v, a)"
                                  >
                                    {{ t('remove') || 'Հեռացնել' }}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            <tr v-if="(v.applications || []).length === 0">
                              <td :colspan="hasStages(v) ? 5 : 4" class="p-6 text-center text-gray-500">
                                {{ t('empty') || 'Դատարկ է' }}
                              </td>
                            </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <!-- Add candidates quick action (ACTIVE only) -->
                      <div class="flex items-center justify-end" v-if="canAddCandidates(v)">
                        <button class="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                @click="openCandidates(v)">
                          {{ t('add_candidate') || 'Ավելացնել թեկնածու' }}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="!loading && rows.length === 0">
                <td colspan="8" class="p-6 text-center text-gray-500">
                  {{ t('empty') || 'Չկան համապատասխան հրապարակումներ' }}
                </td>
              </tr>
              <tr v-if="loading && rows.length">
                <td colspan="8" class="p-3 text-center text-sm text-slate-500">{{ t('loading') || 'Բեռնվում է…' }}</td>
              </tr>
              <tr v-if="eof && rows.length">
                <td colspan="8" class="p-3 text-center text-xs text-slate-400">—</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="mt-2 text-sm text-slate-500">{{ rows.length }} {{ t('results') || 'արդյունք' }}</div>
      </div>

      <!-- Mobile cards -->
      <div class="p-4 md:hidden">
        <div ref="scrollBoxMobile" class="space-y-3 max-h-[70vh] overflow-auto" @scroll="onScroll">
          <div v-for="v in rows" :key="'m-'+v.id" class="bg-white rounded-xl border border-gray-200 p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="text-xs text-slate-500">#{{ v.id }}</div>
                <div class="font-medium">{{ v.title ?? `Vacancy #${v.id}` }}</div>
                <div class="text-xs text-slate-600">{{ v.description || '—' }}</div>
              </div>
              <span class="px-2 py-0.5 rounded text-xs h-fit" :class="statusClass(v.status)">{{
                  statusLabel(v.status)
                }}</span>
            </div>

            <div class="text-xs mt-2"><b>{{ t('department') || 'Department' }}:</b> {{ displayDept(v) }}</div>
            <div class="text-xs mt-1"><b>{{ t('role') || 'Role' }}:</b> {{ displayRole(v) }}</div>
            <div class="text-xs mt-1"><b>{{ t('slots') || 'Slots' }}:</b> {{ v.slots ?? '—' }}</div>

            <div class="flex flex-wrap gap-2 mt-3">
              <button
                  v-if="(v.applications?.length || 0) > 0"
                  class="px-3 py-1 text-xs rounded-md border"
                  @click="toggleOpen(v.id)"
              >
                {{ t('candidates') || 'Թեկնածուներ' }} ({{ v.applications.length }})
              </button>

              <button v-if="canAddCandidates(v)" class="px-3 py-1 text-xs rounded-md bg-blue-600 text-white"
                      @click="openCandidates(v)">
                {{ t('add_candidate') || 'Ավելացնել թեկնածու' }}
              </button>

              <template v-if="isPending(v)">
                <button class="px-3 py-1 text-xs rounded-md bg-green-600 text-white" @click="approve(v)">
                  {{ t('approve') || 'Հաստատել' }}
                </button>
                <button class="px-3 py-1 text-xs rounded-md bg-red-600 text-white" @click="reject(v)">
                  {{ t('reject') || 'Մերժել' }}
                </button>
                <button
                    class="px-3 py-1 text-xs rounded-md border hover:bg-gray-50"
                    @click="openEdit(v)"

                >
                  {{ t('edit') || 'Խմբագրել' }}
                </button>
              </template>
              <template v-else-if="isCanceled(v)">
                <span class="text-xs text-slate-500">{{ t('no_actions') || 'Գործողություններ չկա' }}</span>
              </template>
              <template v-else-if="isActive(v)">
                <button class="px-3 py-1 text-xs rounded-md border" @click="archive(v)">{{
                    t('archive') || 'Արխիվացնել'
                  }}
                </button>
                <button
                    class="px-3 py-1 text-xs rounded-md border hover:bg-gray-50"
                    @click="openEdit(v)"

                >
                  {{ t('edit') || 'Խմբագրել' }}
                </button>
              </template>
              <template v-else-if="isClosed(v)">
                <span class="text-xs text-slate-500">{{ t('archived') || 'Արխիվացված' }}</span>
              </template>
            </div>

            <!-- Candidates list -->
            <div v-if="isOpen(v.id)" class="mt-3 border rounded-lg p-2">
              <div class="text-sm font-medium mb-2">{{ t('candidates') || 'Թեկնածուներ' }}</div>
              <div v-for="a in (v.applications || [])" :key="'m-app-' + a.id" class="border-t py-2">
                <div class="font-medium">{{ a.candidate?.first_name }} {{ a.candidate?.last_name }}</div>
                <div class="text-xs text-slate-500">{{ a.candidate?.email || a.candidate?.phone || '—' }}</div>
                <div class="text-xs mt-1">
                  <span class="px-2 py-0.5 rounded text-xs"
                        :class="appStatusClass(a.status)">{{ appStatusLabel(a.status) }}</span>
                  <span v-if="hasStages(v)">{{
                      isInterviewing(a) ? stageLabel(v, a) : currentStageLabelOrDash(v, a)
                    }}</span>
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                  <button
                      v-if="hasStages(v) && isInReview(a)"
                      class="px-3 py-1 text-xs rounded-md bg-blue-600 text-white"
                      @click="startInterview(v, a)"
                  >{{ t('interview') || 'Հարցազրույց' }}
                  </button>

                  <!-- NEXT: only while interviewing and has next -->
                  <button
                      v-if="hasStages(v) && isInterviewing(a) && hasNextStage(v, a)"
                      class="px-3 py-1 text-xs rounded-md border"
                      @click="nextStage(v, a)"
                  >{{ t('next') || 'Հաջ.' }}
                  </button>

                  <template v-if="!isFinal(a)">
                    <button class="px-3 py-1 text-xs rounded-md bg-green-600 text-white" @click="hire(v, a)"
                            :disabled="!canHire(v, a)">
                      {{ t('hire') || 'Ընդունել' }}
                    </button>
                    <button class="px-3 py-1 text-xs rounded-md bg-red-600 text-white" @click="rejectApp(v, a)">
                      {{ t('reject') || 'Մերժել' }}
                    </button>

                  </template>

                  <button v-if="!hasStages(v)" class="px-3 py-1 text-xs rounded-md border text-red-600"
                          @click="removeCandidateSimple(v, a)">
                    {{ t('remove') || 'Հեռացնել' }}
                  </button>
                </div>
              </div>

              <div class="pt-2" v-if="canAddCandidates(v)">
                <button class="px-3 py-1 text-xs rounded-md bg-blue-600 text-white" @click="openCandidates(v)">
                  {{ t('add_candidate') || 'Ավելացնել թեկնածու' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="!loading && rows.length === 0" class="p-6 text-center text-gray-500">
            {{ t('empty') || 'Դատարկ է' }}
          </div>
          <div v-if="loading && rows.length" class="p-3 text-center text-sm text-slate-500">
            {{ t('loading') || 'Բեռնվում է…' }}
          </div>
          <div v-if="eof && rows.length" class="p-3 text-center text-xs text-slate-400">—</div>
        </div>
        <div class="mt-2 text-sm text-slate-500">{{ rows.length }} {{ t('results') || 'արդյունք' }}</div>
      </div>
    </div>

    <!-- Add/Remove candidates modal -->
    <div v-if="cand.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="cand.open=false" aria-label="Close"></div>
      <div class="relative bg-white w-[92vw] max-w-3xl rounded-2xl shadow-xl overflow-hidden">
        <div class="p-4 border-b">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-semibold">{{ t('manage_candidates') || 'Կառավարել թեկնածուներին' }}</div>
              <div class="mt-1 text-xs text-slate-600 space-x-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100"><b>ID:</b> <span>#{{
                    cand.meta.id
                  }}</span></span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100"><b>{{
                    t('vacancy') || 'Vacancy'
                  }}:</b> <span>{{ cand.meta.title }}</span></span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100"><b>{{
                    t('department') || 'Department'
                  }}:</b> <span>{{ cand.meta.department }}</span></span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100"><b>{{
                    t('role') || 'Role'
                  }}:</b> <span>{{ cand.meta.role }}</span></span>
              </div>
            </div>
            <button class="px-2 py-1 rounded border text-sm" @click="cand.open=false" aria-label="Close">×</button>
          </div>
        </div>

        <div class="p-4 grid gap-4 md:grid-cols-2">
          <!-- Attached -->
          <div class="rounded-xl border border-gray-200 overflow-hidden">
            <div class="px-3 py-2 bg-gray-50 border-b text-sm font-medium">
              {{ t('attached_candidates') || 'Կցված թեկնածուներ' }}
            </div>
            <div class="max-h-[60vh] overflow-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 sticky top-0 z-10 text-left">
                <tr>
                  <th class="px-3 py-2 w-16">#</th>
                  <th class="px-3 py-2">{{ t('full_name') || 'Անուն Ազգանուն' }}</th>
                  <th v-if="hasStages(cand.vacancy)" class="px-3 py-2">{{ t('stage') || 'Փուլ' }}</th>
                  <th class="px-3 py-2 w-28"></th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="c in cand.attached" :key="'a-'+c.id" class="border-t">
                  <td class="px-3 py-2 font-mono">#{{ c.id }}</td>
                  <td class="px-3 py-2">
                    <div class="font-medium">{{ c.first_name }} {{ c.last_name }}</div>
                    <div class="text-xs text-slate-500">{{ c.email || c.phone || '—' }}</div>
                  </td>

                  <!-- Current stage by candidate_id -->
                  <td v-if="hasStages(cand.vacancy)" class="px-3 py-2">
                    <span class="text-xs font-medium">{{ stageLabelByCandidateId(c.id) }}</span>
                  </td>

                  <td class="px-3 py-2 text-right">
                    <button class="px-3 py-1 text-xs rounded-md border hover:bg-red-50 text-red-600"
                            @click="removeCandidate(c)" :disabled="cand.loadingAttached">
                      {{ t('remove') || 'Հեռացնել' }}
                    </button>
                  </td>
                </tr>

                <tr v-if="!cand.loadingAttached && cand.attached.length===0">
                  <td :colspan="hasStages(cand.vacancy) ? 4 : 3" class="p-6 text-center text-gray-500">
                    {{ t('empty') || 'Դատարկ է' }}
                  </td>
                </tr>
                <tr v-if="cand.loadingAttached">
                  <td :colspan="hasStages(cand.vacancy) ? 4 : 3" class="p-3 text-center text-sm text-slate-500">
                    {{ t('loading') || 'Բեռնվում է…' }}
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Search/Add (hidden if vacancy NOT ACTIVE) -->
          <div class="rounded-xl border border-gray-200 overflow-hidden" v-if="isActive(cand.vacancy)">
            <div class="px-3 py-2 bg-gray-50 border-b text-sm font-medium">
              {{ t('add_candidates') || 'Ավելացնել թեկնածու' }}
            </div>


            <div class="p-3 flex flex-col gap-3">
              <div class="text-sm text-slate-600">
                {{
                  t('hint_last_50') || 'Ցուցադրվում են վերջին 50 թեկնածուները։ Ավելին գտնելու համար օգտագործեք որոնումը։'
                }}
              </div>

              <input
                  v-model="cand.q"
                  @input="debouncedCandSearch"
                  :placeholder="t('search_by_name') || 'Որոնել՝ անուն, ազգանուն…'"
                  class="border border-gray-300 rounded-xl px-3 py-2"
              />

              <div class="rounded-xl border border-gray-200 overflow-hidden">
                <div class="max-h-[52vh] overflow-auto">
                  <table class="min-w-full text-sm">
                    <thead class="bg-gray-50 sticky top-0 z-10 text-left">
                    <tr>
                      <th class="px-3 py-2 w-16">#</th>
                      <th class="px-3 py-2">{{ t('full_name') || 'Անուն Ազգանուն' }}</th>
                      <th class="px-3 py-2 w-24"></th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="c in cand.rows" :key="'s-'+c.id" class="border-t">
                      <td class="px-3 py-2 font-mono">#{{ c.id }}</td>
                      <td class="px-3 py-2">
                        <div class="font-medium">{{ c.first_name }} {{ c.last_name }}</div>
                        <div class="text-xs text-slate-500">{{ c.email || c.phone || '—' }}</div>
                      </td>
                      <td class="px-3 py-2 text-right">
                        <button
                            v-if="!isAlreadyAttached(c.id)"
                            class="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                            @click="addCandidate(c)"
                            :disabled="cand.loading"
                        >
                          {{ t('add') || 'Ավելացնել' }}
                        </button>
                        <span v-else class="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                            {{ t('attached') || 'Կցված է' }}
                          </span>
                      </td>
                    </tr>

                    <tr v-if="!cand.loading && cand.rows.length===0">
                      <td colspan="3" class="p-6 text-center text-gray-500">{{ t('empty') || 'Դատարկ է' }}</td>
                    </tr>
                    <tr v-if="cand.loading">
                      <td colspan="3" class="p-3 text-center text-sm text-slate-500">
                        {{ t('loading') || 'Բեռնվում է…' }}
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="text-xs text-slate-500">
                {{ t('search_only_more') || 'Ավելին տեսնելու համար օգտագործեք որոնումը (մինչև 50 արդյունք)' }}
              </div>
            </div>
          </div>

          <!-- If not active, show a small notice instead of Add pane -->
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" v-else>
            {{ t('add_disabled_for_inactive') || 'Թեկնածուներ ավելացնելը հասանելի է միայն ակտիվ թափուրների համար' }}
          </div>
        </div>
      </div>

    </div>
  </div>
  <VacancyFormModal
      v-if="modal.open"
      :open="modal.open"
      :row="modal.row"
      :role-position-id="modal.rolePositionId"
      :initial="modal.initial"
      @close="modal.open = false"
      @saved="onSavedVacancy"
  />
</template>

<script setup>
import VacancyFormModal from './components/VacancyFormModal.vue'
import {computed, nextTick, onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {candidateApi, vacancyApi} from '@/api.js'
import {useToast} from "vue-toastification";

const {t} = useI18n({useScope: 'global'})
const router = useRouter()

const uiError = ref('')
const toast = useToast();
/* Enums (canonical) */
const VACANCY = Object.freeze({PENDING: 'pending', CANCELED: 'canceled', ACTIVE: 'active', CLOSED: 'closed'})
/* NOTE: API may send "interview" or "interviewing". We normalize below. */
const APP = Object.freeze({IN_REVIEW: 'in_review', INTERVIEW: 'interview', HIRED: 'hired', REJECTED: 'rejected'})

/* Filters */
const q = ref('')
const status = ref('')
const department = ref('') // keep as string for v-model; convert to number for API

/* Data + paging */
const rows = ref([])
const loading = ref(false)
const eof = ref(false)
const limit = 5
let offset = 0

/* Expanded vacancies (by Candidates button) */
const openSet = reactive(new Set())
const toggleOpen = id => (openSet.has(id) ? openSet.delete(id) : openSet.add(id))
const isOpen = id => openSet.has(id)

/* Options */
const statusOptions = [VACANCY.PENDING, VACANCY.ACTIVE, VACANCY.CANCELED, VACANCY.CLOSED]

/* Persistent departments (don’t shrink on filter) */
const deptMap = reactive(new Map())
const departmentOptions = computed(() => Array.from(deptMap.values()))

function mergeDeptFromVacancy(v) {
  const id = v?.role_position?.department_id
  if (id == null) return
  const key = String(id)
  const label = v?.role_position?.department?.name || `Dept #${id}`
  if (!deptMap.has(key)) deptMap.set(key, {value: key, label})
}

/* Display helpers */
function displayDept(v) {
  const rp = v?.role_position
  return rp?.department?.name || (rp?.department_id != null ? `Dept #${rp.department_id}` : '—')
}

function displayDeptId(v) {
  const rp = v?.role_position
  return rp?.department?.id || (rp?.department_id != null ? `Dept #${rp.department_id}` : '—')
}

function displayRole(v) {
  const rp = v?.role_position
  return rp?.role?.name || (rp?.role_id != null ? `Role #${rp.role_id}` : '—')
}

/* Stage helpers */
function hasStages(v) {
  return Array.isArray(v?.role_position?.interview_stages) && v.role_position.interview_stages.length > 0
}

function getStages(v) {
  return (v?.role_position?.interview_stages || [])
      .slice()
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

const stageNames = v => getStages(v).map(s => s.name)

function findStageById(v, stageId) {
  if (stageId == null) return null
  const sid = String(stageId)
  return getStages(v).find(s => String(s.id) === sid) || null
}

function firstStage(v) {
  return getStages(v)[0] || null
}

function nextStageOf(v, stageId) {
  console.log(v)
  const arr = getStages(v)
  const sid = String(stageId)
  const idx = arr.findIndex(s => String(s.id) === sid)
  return idx >= 0 && idx < arr.length - 1 ? arr[idx + 1] : null
}

function ensureAppMeta(a) {
  a.meta = a.meta || {}
}

/* Status normalize so "interview" and "interviewing" both work */
function normalizeStatus(s) {
  const x = (s || '').toLowerCase()
  if (x === 'interview') return APP.INTERVIEW
  return x
}

/* Labels / classes */
function statusLabel(s) {
  s = (s || '').toLowerCase()
  return s === 'pending' ? (t('pending') || 'Սպասում է')
      : s === 'canceled' ? (t('canceled') || 'Չեղարկված')
          : s === 'active' ? (t('active') || 'Ակտիվ')
              : s === 'closed' ? (t('closed') || 'Արխիվացված')
                  : s || '—'
}

function statusClass(s) {
  s = (s || '').toLowerCase()
  return s === 'pending' ? 'bg-amber-100 text-amber-700'
      : s === 'canceled' ? 'bg-red-100 text-red-700'
          : s === 'active' ? 'bg-blue-100 text-blue-700'
              : s === 'closed' ? 'bg-slate-200 text-slate-700'
                  : 'bg-slate-100 text-slate-700'
}

const isPending = v => (v?.status || '').toLowerCase() === VACANCY.PENDING
const isCanceled = v => (v?.status || '').toLowerCase() === VACANCY.CANCELED
const isActive = v => (v?.status || '').toLowerCase() === VACANCY.ACTIVE
const isClosed = v => (v?.status || '').toLowerCase() === VACANCY.CLOSED
const canAddCandidates = v => isActive(v)

/* Application status (uses normalizeStatus) */
function appStatusLabel(s) {
  const n = normalizeStatus(s)
  return n === APP.IN_REVIEW ? 'Ստուգման մեջ'
      : n === APP.INTERVIEW ? 'Հարցազրույց'
          : n === APP.HIRED ? 'Ընդունված'
              : n === APP.REJECTED ? 'Մերժված'
                  : n || '—'
}

function appStatusClass(s) {
  const n = normalizeStatus(s)
  return n === APP.IN_REVIEW ? 'bg-slate-100 text-slate-700'
      : n === APP.INTERVIEW ? 'bg-amber-100 text-amber-700'
          : n === APP.HIRED ? 'bg-green-100 text-green-700'
              : n === APP.REJECTED ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-700'
}

const isInReview = a => normalizeStatus(a?.status) === APP.IN_REVIEW
const isInterviewing = a => normalizeStatus(a?.status) === APP.INTERVIEW

function isFinal(a) {
  const st = normalizeStatus(a?.status)
  return st === APP.HIRED || st === APP.REJECTED
}

/* Stage labels (main table / modal) */
function stageLabel(v, a) {
  if (!hasStages(v)) return '—'
  ensureAppMeta(a)
  return findStageById(v, a.meta.stage_id)?.name ?? '—'
}

function currentStageLabelOrDash(v, a) {
  if (!hasStages(v)) return '—'
  ensureAppMeta(a)
  return a.meta.stage_id != null ? (findStageById(v, a.meta.stage_id)?.name ?? '—') : '—'
}

function stageLabelByCandidateId(candidateId) {
  const v = cand.vacancy
  if (!v || !hasStages(v)) return '—'
  const app = (v.applications || []).find(x => x?.candidate_id === candidateId)
  if (!app) return '—'
  ensureAppMeta(app)
  const st = findStageById(v, app.meta.stage_id ?? app.stage_id ?? app.interview_stage_id)
  return st?.name ?? '—'
}

/* Hiring logic */
function countHired(v) {
  return (v.applications || []).filter(a => normalizeStatus(a.status) === APP.HIRED).length
}

function othersNonRejectedCount(v) {
  return (v.applications || []).filter(a => ![APP.HIRED, APP.REJECTED].includes(normalizeStatus(a.status))).length
}

function canHire(v, a) {
  if (isFinal(a)) return false
  const slots = Number(v.slots || 0)
  if (!slots) return true
  return countHired(v) < slots || normalizeStatus(a.status) === APP.HIRED
}

/* NEXT availability helper */
function hasNextStage(v, a) {
  if (!hasStages(v)) return false
  ensureAppMeta(a)
  const next = nextStageOf(v, a.meta.stage_id)
  return !!next
}

/* API: list + paging */
async function fetchPage() {
  if (loading.value || eof.value) return
  loading.value = true
  try {
    const params = {
      search: q.value || undefined,
      status: status.value || undefined,
      department_id: department.value ? Number(department.value) : undefined,
      limit,
      offset
    }
    const res = await vacancyApi?.list?.(params)
    const page = res?.data?.data ?? res?.data ?? res ?? []
    if (!Array.isArray(page)) throw new Error('vacancyApi.list returned non-array')

    if (offset === 0) rows.value = []

    // Normalize + collect dept options
    const normalized = page.map(v => {
      mergeDeptFromVacancy(v)
      normalizeApps(v)
      return v
    })
    rows.value.push(...normalized)

    if (page.length < limit) eof.value = true
    offset += page.length
  } catch (err) {
    console.error('fetchPage error', err)
    uiError.value = (t('error_loading') || 'Չհաջողվեց բեռնել տվյալները') + ': ' + (err?.message || String(err))
  } finally {
    loading.value = false
  }
}

async function reloadAll(reset = false) {
  if (reset) {
    offset = 0
    eof.value = false
    rows.value = []
  }
  await fetchPage()
}

function normalizeApps(v) {
  if (!Array.isArray(v?.applications)) return
  for (const a of v.applications) {
    ensureAppMeta(a)
    // adopt existing stage id from backend
    if (a.meta.stage_id == null) {
      if (a.stage_id != null) a.meta.stage_id = a.stage_id
      else if (a.interview_stage_id != null) a.meta.stage_id = a.interview_stage_id
    }
    // normalize status to canonical values so UI logic is consistent
    a.status = normalizeStatus(a.status)
  }
}

/* Scroll + debounce */
function onScroll(e) {
  const el = e.target
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) fetchPage()
}

let tmr

function debouncedReload() {
  clearTimeout(tmr)
  tmr = setTimeout(() => reloadAll(true), 300)
}

/* Vacancy actions */
async function approve(v) {
  try {
    if (!confirm(t('confirm_approve') || 'Հաստատե՞լ թափուրը:')) return
    await vacancyApi?.approveStatus?.(v.id)
    v.status = VACANCY.ACTIVE
  } catch (e) {
    console.error(e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

async function reject(v) {
  try {
    if (!confirm(t('confirm_reject') || 'Մերժե՞լ թափուրը:')) return
    await vacancyApi?.cancelStatus?.(v.id)
    v.status = VACANCY.CANCELED
  } catch (e) {
    console.error(e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

async function archive(v) {
  try {
    if (!confirm(t('confirm_archive') || 'Արխիվացնե՞լ թափուրը:')) return
    await vacancyApi?.closeStatus?.(v.id)
    v.status = VACANCY.CLOSED
  } catch (e) {
    console.error(e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

/* Add/Remove candidates modal */
const cand = reactive({
  open: false,
  vacancy: null,
  q: '',
  rows: [],
  loading: false,
  attached: [],
  loadingAttached: false,
  meta: {id: null, title: '', department: '', role: '', department_id: ''}
})

function openCandidates(vacancy) {
  if (!isActive(vacancy)) return
  cand.vacancy = vacancy
  cand.q = ''
  cand.meta = {
    id: vacancy?.id ?? null,
    title: vacancy?.title ?? '—',
    department: displayDept(vacancy),
    department_id: displayDeptId(vacancy),
    role: displayRole(vacancy)
  }
  cand.open = true
  loadAttachedCandidates().finally(loadCandidates)
}

const attachedIdSet = computed(() => new Set(cand.attached.map(a => a.id)))
const isAlreadyAttached = id => attachedIdSet.value.has(id)

async function loadAttachedCandidates() {
  cand.loadingAttached = true
  try {
    let arr = []
    if (vacancyApi?.listCandidates) {
      const res = await vacancyApi.listCandidates(cand.vacancy.id, {limit: 50, offset: 0})
      arr = res?.data?.data ?? res?.data ?? res ?? []
    } else {
      const apps = Array.isArray(cand.vacancy?.applications) ? cand.vacancy.applications : []
      arr = apps.map(a => a?.candidate).filter(Boolean)
    }
    cand.attached = Array.isArray(arr) ? arr : []
  } catch (e) {
    console.error('listCandidates error', e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
    cand.attached = []
  } finally {
    cand.loadingAttached = false
  }
}

async function loadCandidates() {
  cand.loading = true
  try {
    const params = {limit: 50, offset: 0, with_worker: 0}
    if (cand.q && cand.q.trim()) params.search = cand.q.trim()
    const res = await candidateApi?.list?.(params)
    const arr = res?.data?.data ?? res?.data ?? res ?? []
    cand.rows = Array.isArray(arr) ? arr : []
  } catch (e) {
    console.error('candidateApi.list error', e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
    cand.rows = []
  } finally {
    cand.loading = false
  }
}

let tmrCand

function debouncedCandSearch() {
  clearTimeout(tmrCand)
  tmrCand = setTimeout(() => loadCandidates(), 300)
}

/* CANDIDATE-LEVEL INTERVIEW */
async function startInterview(v, a) {
  if (!hasStages(v)) return
  ensureAppMeta(a)
  const first = firstStage(v)
  if (!first) return
  const oldStatus = a.status, oldId = a.meta.stage_id
  a.status = APP.INTERVIEW   // normalize to "interview"
  a.meta.stage_id = first.id
  try {
    // If your backend supports status setting separately, you can also call it here.
    // try { await vacancyApi.setCandidateStatus?.(v.id, { candidate_id: a.candidate_id, status: APP.INTERVIEW }) } catch {}
    await vacancyApi.setCandidateStage(v.id, {candidate_id: a.candidate_id, stage_id: a.meta.stage_id})
  } catch (e) {
    a.status = oldStatus
    a.meta.stage_id = oldId
    console.error('startInterview failed', e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

async function nextStage(v, a) {
  if (!hasStages(v)) return
  if (!isInterviewing(a)) return
  ensureAppMeta(a)
  const next = nextStageOf(v, a.meta.stage_id)
  if (!next) return
  const oldId = a.meta.stage_id
  a.meta.stage_id = next.id
  try {
    await vacancyApi.setCandidateStage(v.id, {candidate_id: a.candidate_id, stage_id: a.meta.stage_id})
  } catch (e) {
    a.meta.stage_id = oldId
    console.error('setStage failed', e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

async function addCandidate(c) {
  try {
    await vacancyApi.addCadidate(cand.vacancy.id, {candidate_id:c.id, department_id:cand.meta.department_id}) // legacy spelling in your API
    // update modal attached
    cand.attached = [...cand.attached, {
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone,
      cv_url: c.cv_url
    }]
    // update main table applications (optimistic)
    const row = rows.value.find(r => r.id === cand.vacancy.id)
    if (row) {
      const exists = (row.applications || []).some(a => a?.candidate_id === c.id)
      if (!exists) {
        row.applications = [...(row.applications || []), {
          id: `tmp_${Date.now()}`,
          vacancy_id: row.id,
          candidate_id: c.id,
          status: APP.IN_REVIEW,
          candidate: {...c},
          meta: {stage_id: null}
        }]
      }
    }
    toast.success(t('candidate_added'))
  } catch (e) {
    console.error('attachCandidate error', e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

async function removeCandidate(c) {
  if (!confirm(t('confirm_remove_candidate') || 'Հեռացնե՞լ թեկնածուին այս թափուրից:')) return
  try {
    await vacancyApi.removeCadidate(cand.vacancy.id, c.id) // legacy spelling
    cand.attached = cand.attached.filter(a => a.id !== c.id)
    const row = rows.value.find(r => r.id === cand.vacancy.id)
    if (row?.applications?.length) {
      row.applications = row.applications.filter(a => a?.candidate_id !== c.id)
    }
    toast.success(t('candidate_removed'))

  } catch (e) {
    console.error('detachCandidate error', e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

async function hire(v, a) {
  if (!canHire(v, a)) return
  const old = a.status
  a.status = APP.HIRED
  try {
    await vacancyApi.hireCandidate(v.id, {candidate_id: a.candidate_id})
    if (Number(v.slots || 0) && countHired(v) >= Number(v.slots) && othersNonRejectedCount(v) > 0) {
      await rejectOthers(v)
    }
    if (Number(v.slots || 0) && countHired(v) >= Number(v.slots)) {
      v.status = VACANCY.CLOSED
    }
  } catch (e) {
    a.status = old
    console.error('hire failed', e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

async function rejectApp(v, a) {
  if (isFinal(a)) return
  const old = a.status
  a.status = APP.REJECTED
  try {
    await vacancyApi.rejectCandidate(v.id, {candidate_id: a.candidate_id})
  } catch (e) {
    a.status = old
    console.error('reject failed', e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

async function rejectOthers(v) {
  try {
    for (const a of (v.applications || [])) {
      if (normalizeStatus(a.status) !== APP.HIRED) a.status = APP.REJECTED
    }
  } catch (e) {
    console.error('reject candidates failed', e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

async function removeCandidateSimple(v, a) {
  if (!confirm(t('confirm_remove_candidate') || 'Հեռացնե՞լ թեկնածուին այս թափուրից:')) return
  try {
    await vacancyApi.removeCadidate(v.id, a.candidate_id) // legacy spelling
    v.applications = (v.applications || []).filter(x => x.candidate_id !== a.candidate_id)
  } catch (e) {
    console.error('removeCandidateSimple', e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}

const modal = reactive({
  open: false,
  row: null,               // can hold role_position info if needed
  rolePositionId: null,    // numeric
  initial: null            // { slots, title, description }
})

function openEdit(v) {
  // v — vacancy row from the table
  modal.open = true
  modal.row = { // keep some context similar to what the modal expects
    id: v?.role_position_id ?? v?.role_position?.id ?? null,
    role_position: v?.role_position || null,
    vacancy: v // tells the modal we're editing
  }
  modal.rolePositionId = v?.role_position_id ?? v?.role_position?.id ?? null
  modal.initial = {
    slots: Number(v?.slots ?? 1),
    title: v?.title ?? '',
    description: v?.description ?? ''
  }
}

async function onSavedVacancy() {
  modal.open = false
  await reloadAll(true) // refresh list to reflect updates
}

/* Init */
onMounted(async () => {
  await nextTick()
  await reloadAll(true)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
