import React, { useContext } from 'react';
import * as lookupService from '../../services/lookupService';
import * as memberService from '../../services/memberService';
import { LookupManagerGrid } from '../../components/LookupManager';
import { AuthContext } from '../../contexts/AuthContext';

export default function LookupsPage() {
  const { fetchWithAuth } = useContext(AuthContext) || {};

  const managers = [
    {
      label: "Titles",
      fetchAll: (fetch) => lookupService.getTitles(fetch),
      create: (fetch, name) => lookupService.createTitle(fetch, name),
      update: (fetch, id, name) => lookupService.updateTitle(fetch, id, name),
      remove: (fetch, id) => lookupService.deleteTitle(fetch, id),
    },
    {
      label: "Genders",
      fetchAll: (fetch) => lookupService.getGenders(fetch),
      create: (fetch, name) => lookupService.createGender(fetch, name),
      update: (fetch, id, name) => lookupService.updateGender(fetch, id, name),
      remove: (fetch, id) => lookupService.deleteGender(fetch, id),
    },
    {
      label: "Marital Statuses",
      fetchAll: (fetch) => lookupService.getMaritalStatuses(fetch),
      create: (fetch, name) => lookupService.createMaritalStatus(fetch, name),
      update: (fetch, id, name) => lookupService.updateMaritalStatus(fetch, id, name),
      remove: (fetch, id) => lookupService.deleteMaritalStatus(fetch, id),
    },
    {
      label: "Member Types",
      fetchAll: (fetch) => lookupService.getMemberTypes(fetch),
      create: (fetch, name) => lookupService.createMemberType(fetch, name),
      update: (fetch, id, name) => lookupService.updateMemberType(fetch, id, name),
      remove: (fetch, id) => lookupService.deleteMemberType(fetch, id),
    },
    {
      label: "Member Statuses",
      fetchAll: (fetch) => lookupService.getMemberStatuses(fetch),
      create: (fetch, name) => lookupService.createMemberStatus(fetch, name),
      update: (fetch, id, name) => lookupService.updateMemberStatus(fetch, id, name),
      remove: (fetch, id) => lookupService.deleteMemberStatus(fetch, id),
    },
    {
      label: "Nationalities",
      fetchAll: (fetch) => lookupService.getNationalities(fetch),
      create: (fetch, name) => lookupService.createNationality(fetch, name),
      update: (fetch, id, name) => lookupService.updateNationality(fetch, id, name),
      remove: (fetch, id) => lookupService.deleteNationality(fetch, id),
    },
    {
      label: "Churches",
      fetchAll: (fetch) => lookupService.getChurches(fetch),
      create: (fetch, name) => lookupService.createChurch(fetch, name),
      update: (fetch, id, name) => lookupService.updateChurch(fetch, id, name),
      remove: (fetch, id) => lookupService.deleteChurch(fetch, id),
    },
    {
      label: "Departments",
      fetchAll: (fetch) => memberService.getDepartments(fetch),
      create: (fetch, name) => memberService.createDepartment(fetch, { name }),
      update: (fetch, id, name) => memberService.updateDepartment(fetch, id, { name }),
      remove: (fetch, id) => memberService.deleteDepartment(fetch, id),
    },
  ];

  return (
    <div>
      <h2>Lookups Management</h2>
      <LookupManagerGrid managers={managers} />
    </div>
  );
}