"use client";

import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Minnesota counties list (all 87 counties, alphabetically sorted)
const MINNESOTA_COUNTIES = [
  "Aitkin",
  "Anoka",
  "Becker",
  "Beltrami",
  "Benton",
  "Big Stone",
  "Blue Earth",
  "Brown",
  "Carlton",
  "Carver",
  "Cass",
  "Chippewa",
  "Chisago",
  "Clay",
  "Clearwater",
  "Cook",
  "Cottonwood",
  "Crow Wing",
  "Dakota",
  "Dodge",
  "Douglas",
  "Faribault",
  "Fillmore",
  "Freeborn",
  "Goodhue",
  "Grant",
  "Hennepin",
  "Houston",
  "Hubbard",
  "Isanti",
  "Itasca",
  "Jackson",
  "Kanabec",
  "Kandiyohi",
  "Kittson",
  "Koochiching",
  "Lac qui Parle",
  "Lake",
  "Lake of the Woods",
  "Le Sueur",
  "Lincoln",
  "Lyon",
  "Mahnomen",
  "Marshall",
  "Martin",
  "McLeod",
  "Meeker",
  "Mille Lacs",
  "Morrison",
  "Mower",
  "Murray",
  "Nicollet",
  "Nobles",
  "Norman",
  "Olmsted",
  "Otter Tail",
  "Pennington",
  "Pine",
  "Pipestone",
  "Polk",
  "Pope",
  "Ramsey",
  "Red Lake",
  "Redwood",
  "Renville",
  "Rice",
  "Rock",
  "Roseau",
  "Scott",
  "Sherburne",
  "Sibley",
  "St. Louis",
  "Stearns",
  "Steele",
  "Stevens",
  "Swift",
  "Todd",
  "Traverse",
  "Wabasha",
  "Wadena",
  "Waseca",
  "Washington",
  "Watonwan",
  "Wilkin",
  "Winona",
  "Wright",
  "Yellow Medicine",
];

export interface AddressFormData {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
}

interface AddressFormProps {
  // React Hook Form integration
  register?: UseFormRegister<any>;
  control?: Control<any>;
  errors?: FieldErrors<any>;
  // Controlled mode (for non-react-hook-form usage)
  value?: AddressFormData;
  onChange?: (data: AddressFormData) => void;
  // Error handling for controlled mode (simple object with field names and error messages)
  fieldErrors?: Record<string, string>;
  // Display options
  showCard?: boolean;
  title?: string;
  description?: string;
  // Field customization
  defaultState?: string;
  requiredFields?: {
    addressLine1?: boolean;
    addressLine2?: boolean;
    city?: boolean;
    state?: boolean;
    zipCode?: boolean;
    county?: boolean;
  };
  // Styling
  className?: string;
}

export function AddressForm({
  register,
  control,
  errors,
  value,
  onChange,
  fieldErrors,
  showCard = false,
  title = "Address Information",
  description = "Enter the complete address",
  defaultState = "MN",
  requiredFields = {
    addressLine1: true,
    city: true,
    state: true,
    zipCode: true,
    county: true,
  },
  className,
}: AddressFormProps) {
  // Determine if we're using react-hook-form or controlled mode
  const isReactHookForm = !!register || !!control;
  const isControlled = !isReactHookForm && !!value && !!onChange;

  // Helper function to get error message
  const getErrorMessage = (fieldName: string): string | undefined => {
    if (isReactHookForm && errors) {
      const error = errors[fieldName];
      return error?.message as string | undefined;
    }
    if (isControlled && fieldErrors) {
      return fieldErrors[fieldName];
    }
    return undefined;
  };

  // Helper function to check if field has error
  const hasError = (fieldName: string): boolean => {
    return !!getErrorMessage(fieldName);
  };

  // Controlled mode handlers
  const handleControlledChange = (
    field: keyof AddressFormData,
    fieldValue: string
  ) => {
    if (onChange && value) {
      onChange({
        ...value,
        [field]: fieldValue,
      });
    }
  };

  const formContent = (
    <div className={`space-y-4 ${className || ""}`}>
      {/* Address Line 1 */}
      <div className="space-y-2">
        <Label htmlFor="addressLine1">
          Address Line 1 {requiredFields.addressLine1 && "*"}
        </Label>
        {isReactHookForm && register ? (
          <>
            <Input
              id="addressLine1"
              {...register("addressLine1")}
              placeholder="123 Main Street"
              className={cn(hasError("addressLine1") && "border-destructive")}
            />
            {hasError("addressLine1") && (
              <p className="text-sm text-destructive">
                {getErrorMessage("addressLine1")}
              </p>
            )}
          </>
        ) : isControlled ? (
          <>
            <Input
              id="addressLine1"
              value={value.addressLine1 || ""}
              onChange={(e) =>
                handleControlledChange("addressLine1", e.target.value)
              }
              placeholder="123 Main Street"
              className={cn(hasError("addressLine1") && "border-destructive")}
            />
            {hasError("addressLine1") && (
              <p className="text-sm text-destructive">
                {getErrorMessage("addressLine1")}
              </p>
            )}
          </>
        ) : (
          <Input id="addressLine1" placeholder="123 Main Street" />
        )}
      </div>

      {/* Address Line 2 */}
      <div className="space-y-2">
        <Label htmlFor="addressLine2">
          Address Line 2 {requiredFields.addressLine2 && "*"}
        </Label>
        {isReactHookForm && register ? (
          <Input
            id="addressLine2"
            {...register("addressLine2")}
            placeholder="Suite 100, Unit B, etc."
          />
        ) : isControlled ? (
          <Input
            id="addressLine2"
            value={value.addressLine2 || ""}
            onChange={(e) =>
              handleControlledChange("addressLine2", e.target.value)
            }
            placeholder="Suite 100, Unit B, etc."
          />
        ) : (
          <Input id="addressLine2" placeholder="Suite 100, Unit B, etc." />
        )}
      </div>

      {/* City, State, ZIP Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">City {requiredFields.city && "*"}</Label>
          {isReactHookForm && register ? (
            <>
              <Input
                id="city"
                {...register("city")}
                placeholder="Minneapolis"
                className={cn(hasError("city") && "border-destructive")}
              />
              {hasError("city") && (
                <p className="text-sm text-destructive">
                  {getErrorMessage("city")}
                </p>
              )}
            </>
          ) : isControlled ? (
            <>
              <Input
                id="city"
                value={value.city || ""}
                onChange={(e) => handleControlledChange("city", e.target.value)}
                placeholder="Minneapolis"
                className={cn(hasError("city") && "border-destructive")}
              />
              {hasError("city") && (
                <p className="text-sm text-destructive">
                  {getErrorMessage("city")}
                </p>
              )}
            </>
          ) : (
            <Input id="city" placeholder="Minneapolis" />
          )}
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state">State {requiredFields.state && "*"}</Label>
          {isReactHookForm && control ? (
            <Controller
              name="state"
              control={control}
              defaultValue={defaultState}
              render={({ field }) => (
                <>
                  <Input
                    id="state"
                    {...field}
                    placeholder="MN"
                    maxLength={2}
                    className={cn(hasError("state") && "border-destructive")}
                  />
                  {hasError("state") && (
                    <p className="text-sm text-destructive">
                      {getErrorMessage("state")}
                    </p>
                  )}
                </>
              )}
            />
          ) : isReactHookForm && register ? (
            <>
              <Input
                id="state"
                {...register("state")}
                placeholder="MN"
                maxLength={2}
                className={hasError("state") ? "border-destructive" : ""}
              />
              {hasError("state") && (
                <p className="text-sm text-destructive">
                  {getErrorMessage("state")}
                </p>
              )}
            </>
          ) : isControlled ? (
            <>
              <Input
                id="state"
                value={value.state || defaultState}
                onChange={(e) =>
                  handleControlledChange("state", e.target.value.toUpperCase())
                }
                placeholder="MN"
                maxLength={2}
                className={hasError("state") ? "border-destructive" : ""}
              />
              {hasError("state") && (
                <p className="text-sm text-destructive">
                  {getErrorMessage("state")}
                </p>
              )}
            </>
          ) : (
            <Input id="state" placeholder="MN" maxLength={2} />
          )}
        </div>

        {/* ZIP Code */}
        <div className="space-y-2">
          <Label htmlFor="zipCode">
            ZIP Code {requiredFields.zipCode && "*"}
          </Label>
          {isReactHookForm && register ? (
            <>
              <Input
                id="zipCode"
                {...register("zipCode")}
                placeholder="55401"
                className={cn(hasError("zipCode") && "border-destructive")}
              />
              {hasError("zipCode") && (
                <p className="text-sm text-destructive">
                  {getErrorMessage("zipCode")}
                </p>
              )}
            </>
          ) : isControlled ? (
            <>
              <Input
                id="zipCode"
                value={value.zipCode || ""}
                onChange={(e) =>
                  handleControlledChange("zipCode", e.target.value)
                }
                placeholder="55401"
                className={cn(hasError("zipCode") && "border-destructive")}
              />
              {hasError("zipCode") && (
                <p className="text-sm text-destructive">
                  {getErrorMessage("zipCode")}
                </p>
              )}
            </>
          ) : (
            <Input id="zipCode" placeholder="55401" />
          )}
        </div>
      </div>

      {/* County */}
      <div className="space-y-2">
        <Label htmlFor="county">County {requiredFields.county && "*"}</Label>
        {isReactHookForm && control ? (
          <Controller
            name="county"
            control={control}
            render={({ field }) => (
              <>
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="county"
                    className={cn(hasError("county") && "border-destructive")}
                  >
                    <SelectValue placeholder="Select a county" />
                  </SelectTrigger>
                  <SelectContent>
                    {MINNESOTA_COUNTIES.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county} County
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasError("county") && (
                  <p className="text-sm text-destructive">
                    {getErrorMessage("county")}
                  </p>
                )}
              </>
            )}
          />
        ) : isReactHookForm && register && control ? (
          <Controller
            name="county"
            control={control}
            render={({ field }) => (
              <>
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="county"
                    className={cn(hasError("county") && "border-destructive")}
                  >
                    <SelectValue placeholder="Select a county" />
                  </SelectTrigger>
                  <SelectContent>
                    {MINNESOTA_COUNTIES.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county} County
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasError("county") && (
                  <p className="text-sm text-destructive">
                    {getErrorMessage("county")}
                  </p>
                )}
              </>
            )}
          />
        ) : isReactHookForm && register ? (
          <>
            <p className="text-sm text-warning mb-2">
              Note: Control is required for Select component. Please provide
              control prop.
            </p>
            <Input
              id="county"
              {...register("county")}
              placeholder="Select a county"
              className={hasError("county") ? "border-destructive" : ""}
            />
            {hasError("county") && (
              <p className="text-sm text-destructive">
                {getErrorMessage("county")}
              </p>
            )}
          </>
        ) : isControlled ? (
          <>
            <Select
              value={value.county || ""}
              onValueChange={(val) => handleControlledChange("county", val)}
            >
              <SelectTrigger
                id="county"
                className={hasError("county") ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select a county" />
              </SelectTrigger>
              <SelectContent>
                {MINNESOTA_COUNTIES.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county} County
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError("county") && (
              <p className="text-sm text-destructive">
                {getErrorMessage("county")}
              </p>
            )}
          </>
        ) : (
          <Select>
            <SelectTrigger id="county">
              <SelectValue placeholder="Select a county" />
            </SelectTrigger>
            <SelectContent>
              {MINNESOTA_COUNTIES.map((county) => (
                <SelectItem key={county} value={county}>
                  {county} County
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );

  // If showCard is true, wrap in Card component
  if (showCard) {
    return (
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{formContent}</CardContent>
      </Card>
    );
  }

  return formContent;
}
