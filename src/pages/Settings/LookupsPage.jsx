import React from 'react';
import * as lookupService from '../../services/lookupService';
import { LookupManagerGrid } from '../../components/LookupManager';

const managers = [
  {
    label: "Titles",
    fetchAll: lookupService.getTitles,
    create: lookupService.createTitle,
    update: lookupService.updateTitle,
    remove: lookupService.deleteTitle,
  },
  {
    label: "Genders",
    fetchAll: lookupService.getGenders,
    create: lookupService.createGender,
    update: lookupService.updateGender,
    remove: lookupService.deleteGender,
  },
  {
    label: "Marital Statuses",
    fetchAll: lookupService.getMaritalStatuses,
    create: lookupService.createMaritalStatus,
    update: lookupService.updateMaritalStatus,
    remove: lookupService.deleteMaritalStatus,
  },
  {
    label: "Member Types",
    fetchAll: lookupService.getMemberTypes,
    create: lookupService.createMemberType,
    update: lookupService.updateMemberType,
    remove: lookupService.deleteMemberType,
  },
  {
    label: "Member Statuses",
    fetchAll: lookupService.getMemberStatuses,
    create: lookupService.createMemberStatus,
    update: lookupService.updateMemberStatus,
    remove: lookupService.deleteMemberStatus,
  },
  {
    label: "Nationalities",
    fetchAll: lookupService.getNationalities,
    create: lookupService.createNationality,
    update: lookupService.updateNationality,
    remove: lookupService.deleteNationality,
  },
  {
    label: "Churches",
    fetchAll: lookupService.getChurches,
    create: lookupService.createChurch,
    update: lookupService.updateChurch,
    remove: lookupService.deleteChurch,
  },
];

export default function LookupsPage() {
  return (
    <div>
      <h2>Lookups Management</h2>
      <LookupManagerGrid managers={managers} />
    </div>
  );
}