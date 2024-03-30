"use client";
import Loading from "@/components/common/loading";
import { db } from "@/services/firebase";
import { PageProps } from "@/types/common";
import { Ruangan } from "@/types/ruangan";
import { doc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import { Button } from "react-daisyui";
import { useDocument } from "react-firebase-hooks/firestore";
import { FaEdit } from "react-icons/fa";

export default function RuanganPage(props: PageProps) {
  const [snapshot, loading, error] = useDocument(
    doc(db, "ruangan", props.params.id)
  );

  const data = useMemo(
    () => ({ ...snapshot?.data(), id: snapshot?.id } as Ruangan),
    [snapshot]
  );

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-3xl font-semibold">
        Ruangan <span className="text-primary">{data.name}</span>
      </h1>
      <Link href={`/ruangan/${data.id}/edit`}>
        <Button color="primary" startIcon={<FaEdit />}>
          Edit Ruangan
        </Button>
      </Link>
    </div>
  );
}
